import type { QuickJSContext, QuickJSHandle } from "quickjs-emscripten";
import type Parser from "web-tree-sitter"; // Import Parser

// A single node in the AST
export type { SyntaxNode } from "web-tree-sitter";

export const LANGUAGES = ["javascript", "python", "go", "rust", "cpp"] as const;
export type Language = typeof LANGUAGES[number];

export type LinterIssue = {
  type: 'Perf' | 'Security' | 'Style';
  message: string;
};

export type JavaScriptExecutionStep = {
  step: number;
  line: number;
  scope: Record<string, any>;
  issues: LinterIssue[];
};

export type AstExecutionStep = {
  step: number;
  node: Parser.SyntaxNode;
  issues: LinterIssue[];
  executionContext?: {
    phase: 'declaration' | 'initialization' | 'execution' | 'call' | 'return' | 'condition' | 'loop' | 'assignment';
    description: string;
    lineNumber: number;
    codeSnippet: string;
    variables: Record<string, any>;
  };
};

export type ExecutionStep = JavaScriptExecutionStep | AstExecutionStep;

export type ProjectState = {
  language: Language;
  code: string;
  executionSteps: ExecutionStep[];
  currentStepIndex: number;
  isRunning: boolean;
  ast: Parser.Tree | null; // Correct type: Tree, not SyntaxNode
  // If a recent parse detected a syntax error, this holds info for the UI to highlight it
  parseError?: { line?: number; startColumn?: number; endColumn?: number; message: string } | null;
};

export type SharedProjectState = Pick<ProjectState, 'code' | 'language'>;

export type ProjectActions = {
  setLanguage: (language: Language) => void;
  setCode: (code: string) => void;
  run: () => Promise<void>;
  stop: () => void;
  reset: () => void;
  setCurrentStepIndex: (index: number) => void;
  loadFromSharedState: (sharedState: SharedProjectState) => void;
};

export type ProjectStore = ProjectState & ProjectActions;

export type RunHistoryEntry = {
  id: string;
  code: string;
  language: Language;
  executionSteps?: ExecutionStep[];
  currentStepIndex?: number;
  finalOutput?: string;
  timestamp: number;
};

export type RunHistoryActions = {
  runHistory: RunHistoryEntry[];
  addRunToHistory: (entry: Omit<RunHistoryEntry, 'id' | 'timestamp'>) => void;
  restoreRunFromHistory: (id: string) => void;
  clearRunHistory: () => void;
};


export type QuickJSExecutionTools = {
  vm: QuickJSContext;
  consoleHandle: QuickJSHandle;
  proxyHandle: QuickJSHandle;
};