import { create } from 'zustand';
import { ProjectStore, Language, LANGUAGES, SharedProjectState, AstExecutionStep, JavaScriptExecutionStep, RunHistoryEntry, RunHistoryActions } from '@/types';
import { useJsRunner } from './useJsRunner';
import { useTreeSitterParser } from './useTreeSitterParser';
import { runLinter } from '@/lib/linter';
import { createAstTimeline } from '@/lib/astTimeline';
import { createLanguageExecution } from '@/lib/languageExecutors';
import { runInWorker } from '@/lib/workerClients';
import { getCached, setCached, makeKey } from '@/lib/executionCache';
import toast from 'react-hot-toast';
import { nanoid } from 'nanoid';

const initialCodeSamples: Record<Language, string> = {
  javascript: `// Using 'var' is discouraged.
var a = 1;
console.log('Initial a:', a);

// eval() is a security risk.
if (a > 0) {
  // eval("a = 10");
}

console.log('Final a:', a);
`,
  python: `# Simple arithmetic and variable tracking
a = 1
b = 2
c = a + b
print(c)

# String operations
name = "World"
greeting = "Hello"
message = greeting + " " + name
print(message)

# More calculations
x = 10
y = 5
result = x * y + 3
print("Result:", result)
`,
  go: `package main

import "fmt"

func main() {
    // Simple arithmetic
    a := 10
    b := 20
    sum := a + b
    fmt.Println("Sum:", sum)
    
    // String operations
    name := "Go"
    message := "Hello " + name
    fmt.Println(message)
    
    // More calculations
    x := 5
    y := 3
    product := x * y
    fmt.Println("Product:", product)
}
`,
  rust: `fn main() {
    // Simple arithmetic
    let a = 5;
    let b = 10;
    let sum = a + b;
    println!("Sum: {}", sum);
    
    // String operations
    let name = "Rust";
    let greeting = format!("Hello {}", name);
    println!("{}", greeting);
    
    // More calculations
    let x = 7;
    let y = 3;
    let product = x * y;
    println!("Product: {}", product);
}
`,
  cpp: `#include <iostream>

int main() {
    // Simple arithmetic
    int a = 15;
    int b = 25;
    int sum = a + b;
    std::cout << "Sum: " << sum << std::endl;
    
    // More calculations  
    int x = 8;
    int y = 4;
    int product = x * y;
    std::cout << "Product: " << product << std::endl;
    
    return 0;
}
`,
};

export type ProjectStoreWithDialog = ProjectStore & RunHistoryActions & {
  isShareDialogOpen: boolean;
  openShareDialog: () => void;
  closeShareDialog: () => void;
  setExecutionSteps: (steps: any[]) => void;
};

export const useProjectStore = create<ProjectStoreWithDialog>((set, get) => ({
  setExecutionSteps: (steps: any[]) => set({ executionSteps: steps }),
  language: 'javascript',
  code: initialCodeSamples['javascript'],
  runHistory: [],
  executionSteps: [],
  currentStepIndex: -1,
  isRunning: false,
  ast: null,
  isShareDialogOpen: false,

  openShareDialog: () => set({ isShareDialogOpen: true }),
  closeShareDialog: () => set({ isShareDialogOpen: false }),

  setLanguage: (language: Language) => {
    get().reset();
    set({ language, code: initialCodeSamples[language] });
  },

  setCode: (code: string) => set({ code }),

  addRunToHistory: (entry: Omit<RunHistoryEntry, 'id' | 'timestamp'>) => {
    set((state: ProjectStoreWithDialog) => ({ runHistory: [{ ...entry, id: nanoid(), timestamp: Date.now() }, ...(state.runHistory || [])].slice(0, 50) }));
  },

  restoreRunFromHistory: (id: string) => {
    const { runHistory } = get() as ProjectStoreWithDialog;
    const entry = (runHistory || []).find((r) => r.id === id);
    if (entry) {
      set({ code: entry.code, language: entry.language, executionSteps: entry.executionSteps || [], currentStepIndex: typeof entry.currentStepIndex === 'number' ? entry.currentStepIndex : -1 });
    }
  },

  clearRunHistory: () => set({ runHistory: [] }),
  
  loadFromSharedState: (sharedState: SharedProjectState) => {
    get().reset();
    set({
      code: sharedState.code,
      language: sharedState.language,
    });
  },

  run: async () => {
    if (get().isRunning) return;
    set({ isRunning: true, executionSteps: [], currentStepIndex: -1, ast: null });

    const { language, code } = get();

    try {
      // Clear previous parse errors before running
      set({ parseError: null });
      if (language === 'javascript') {
        const { runJsCode } = useJsRunner.getState();
        const steps = await runJsCode(code);
        // Ensure last step has a __finalOutput for consistent UI metrics
        if (Array.isArray(steps) && steps.length > 0) {
          const last = steps[steps.length - 1] as any;
          if (!last.scope) last.scope = {};
          if (!Array.isArray(last.scope.__log)) last.scope.__log = [];
          if (typeof last.scope.__finalOutput === 'undefined') {
            last.scope.__finalOutput = String((last.scope.__log || []).map((v: any) => (typeof v === 'string' ? v : JSON.stringify(v))).join('\n'));
          }
        }
        set({ executionSteps: steps, currentStepIndex: steps.length > 0 ? 0 : -1 });
        // Persist this run to history so UI components (ExecutionSummary) update
        try {
          const add = get().addRunToHistory;
          if (typeof add === 'function') {
            add({ code, language, executionSteps: steps, currentStepIndex: steps.length > 0 ? 0 : -1 });
          }
        } catch (e) {
          // ignore history persistence errors
        }
        
        // Show completion notification for JavaScript
        if (steps.length > 0) {
          const lastStep = steps[steps.length - 1];
          const outputs = lastStep.scope?.__log;
          let finalOutput: string | undefined = undefined;
          if (outputs && outputs.length > 0) {
            const raw = outputs[outputs.length - 1];
            finalOutput = typeof raw === 'string' ? raw : JSON.stringify(raw);
            toast.success(`JavaScript execution completed!\nOutput: ${finalOutput}`, { duration: 4000 });
          } else {
            toast.success('JavaScript execution completed!', { duration: 2000 });
          }
        }
      } else {
        // Validate syntax using Tree-sitter before attempting to simulate execution.
        // If the parser reports errors, surface them and abort execution.
        let steps: any[] = [];
        try {
          const { parseCode } = useTreeSitterParser.getState();
          const tree = await parseCode(code, language);
          // Try the standard hasError() check first, then fallback to searching for ERROR nodes
          let firstErrorNode: any = null;
          const rootNode = (tree as any).rootNode;
          if (rootNode) {
            // preferred: use hasError
            try {
              if (typeof rootNode.hasError === 'function' && rootNode.hasError()) {
                // Try descendantsOfType if available
                firstErrorNode = rootNode.descendantsOfType?.('ERROR')?.[0] || null;
              }
            } catch (e) {
              // ignore
            }

            // If we didn't find an ERROR via helpers, do a BFS traversal to find any ERROR node
            if (!firstErrorNode) {
              try {
                const queue = [rootNode];
                while (queue.length) {
                  const n = queue.shift();
                  if (!n) continue;
                  if (n.type === 'ERROR') { firstErrorNode = n; break; }
                  // Collect children (namedChildren preferred)
                  const children = (n.namedChildren && n.namedChildren.length) ? n.namedChildren : (n.children || []);
                  if (children && children.length) {
                    for (const c of children) queue.push(c);
                  }
                }
              } catch (e) {
                // ignore traversal failures
              }
            }
          }

          if (firstErrorNode) {
            const errLine = firstErrorNode?.startPosition?.row ? firstErrorNode.startPosition.row + 1 : undefined;
            const startCol = firstErrorNode?.startPosition?.column ? firstErrorNode.startPosition.column + 1 : undefined;
            const endCol = firstErrorNode?.endPosition?.column ? firstErrorNode.endPosition.column + 1 : undefined;
            const message = `Syntax error${errLine ? ` on line ${errLine}` : ''}. Please fix the code before running.`;
            set({ parseError: { line: errLine, startColumn: startCol, endColumn: endCol, message } });
            throw new Error(message);
          }

          // Use the new language execution system to mimic JavaScript behavior
          steps = getCached(language, code);
          if (!steps) {
            // Prefer running in a Worker when possible, fall back to sync createLanguageExecution
            steps = await runInWorker(code, language as Language);
            // cache the result for subsequent runs
            try {
              setCached(language, code, steps);
            } catch (e) {
              // ignore cache set errors
            }
          }
        } catch (parseErr: any) {
          // If parseErr is a syntax error we produced above, rethrow to be caught by outer try
          throw parseErr;
        }

        // Defensive normalization: ensure non-JS steps have consistent __log arrays
        if (Array.isArray(steps) && steps.length > 0) {
          // Collate logs across steps and dedupe contiguous duplicates
          const seen: string[] = [];
          for (let i = 0; i < steps.length; i++) {
            const s: any = steps[i] as any;
            if (!s.scope) s.scope = {};
            if (!Array.isArray(s.scope.__log)) s.scope.__log = [];
            // dedupe by stringifying entries and avoiding consecutive duplicates
            const deduped: any[] = [];
            for (const v of s.scope.__log) {
              const str = typeof v === 'string' ? v : JSON.stringify(v);
              if (deduped.length === 0 || (typeof deduped[deduped.length - 1] === 'string' ? deduped[deduped.length - 1] : JSON.stringify(deduped[deduped.length - 1])) !== str) {
                deduped.push(v);
              }
            }
            s.scope.__log = deduped;
          }
          const last = steps[steps.length - 1] as any;
          if (!last.scope) last.scope = {};
          if (!Array.isArray(last.scope.__log)) last.scope.__log = [];
          if (typeof last.scope.__finalOutput === 'undefined') last.scope.__finalOutput = String((last.scope.__log || []).map((v: any) => (typeof v === 'string' ? v : JSON.stringify(v))).join('\n'));
        }
        
        // Also get AST for visualization
        const { parseCode, languageParsers } = useTreeSitterParser.getState();
        const ast = await parseCode(code, language);
        if (ast) {
          const langParser = languageParsers.get(language);
          if (langParser) {
            runLinter(ast.rootNode, langParser, language);
          }
        }
        
        set({
          ast,
          executionSteps: steps,
          currentStepIndex: steps.length > 0 ? 0 : -1,
        });
        // Persist this run to history so UI components (ExecutionSummary) update
        try {
          const add = get().addRunToHistory;
          if (typeof add === 'function') {
            add({ code, language, executionSteps: steps, currentStepIndex: steps.length > 0 ? 0 : -1 });
          }
        } catch (e) {
          // ignore history persistence errors
        }
        
        // Show completion notification with final output for non-JavaScript languages
        if (steps.length > 0) {
          const lastStep = steps[steps.length - 1] as JavaScriptExecutionStep;
          const finalOutput = lastStep.scope?.__finalOutput;
          if (finalOutput) {
            toast.success(`${language.charAt(0).toUpperCase() + language.slice(1)} execution completed!\nOutput: ${finalOutput}`, { duration: 4000 });
          }
        }
      }
    } catch (error: any) {
      console.error("Execution failed:", error);
      toast.error(error.message || 'An unknown error occurred during execution.');
    } finally {
      set({ isRunning: false });
    }
  },

  stop: () => {
    set({ isRunning: false });
  },

  reset: () => {
    set({
      executionSteps: [],
      currentStepIndex: -1,
      isRunning: false,
      ast: null,
    });
  },

  setCurrentStepIndex: (index) => set({ currentStepIndex: index }),
}));

// Client-only helper: hydrate runHistory from localStorage (call from useEffect)
export function hydrateRunHistoryFromStorage() {
  try {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem('lemma.runHistory');
    if (!raw) return;
    const parsed: RunHistoryEntry[] = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      useProjectStore.setState({ runHistory: parsed });
    }
  } catch (e) {
    // ignore parse errors
  }
}

// Client-only helper: start persisting runHistory to localStorage. Safe to call once on mount.
export function startRunHistoryPersistence() {
  if (typeof window === 'undefined') return () => {};
  let prev: RunHistoryEntry[] | undefined = undefined;
  const unsub = useProjectStore.subscribe((state: ProjectStoreWithDialog) => {
    const runHistory = state.runHistory as RunHistoryEntry[] | undefined;
    if (runHistory !== prev) {
      prev = runHistory;
      try {
        window.localStorage.setItem('lemma.runHistory', JSON.stringify(runHistory || []));
      } catch (e) {
        // ignore storage errors
      }
    }
  });
  return unsub;
}

// runHistory persistence and initialization removed