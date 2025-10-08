import { create } from 'zustand';
import { JavaScriptExecutionStep } from '@/types';

type PyodideType = any; // We'll load this dynamically

type PythonRunnerState = {
  pyodide: PyodideType | null;
  init: () => Promise<void>;
  runPythonCode: (code: string) => Promise<JavaScriptExecutionStep[]>;
};

let initPromise: Promise<void> | null = null;

export const usePythonRunner = create<PythonRunnerState>((set, get) => ({
  pyodide: null,

  init: async () => {
    if (typeof window === 'undefined') return;
    
    if (!initPromise) {
      initPromise = (async () => {
        try {
          // Load Pyodide dynamically
          const pyodide = await import('pyodide').then(async (pyodideModule) => {
            return await pyodideModule.loadPyodide({
              indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
            });
          });
          
          set({ pyodide });
        } catch (error) {
          console.error('Failed to load Pyodide:', error);
        }
      })();
    }
    await initPromise;
  },

  runPythonCode: async (code: string) => {
    const { pyodide } = get();
    if (!pyodide) {
      throw new Error('Pyodide not initialized');
    }

    const steps: JavaScriptExecutionStep[] = [];
    let stepCounter = 0;

    // Create a custom print function that captures execution steps
    pyodide.globals.set("captured_steps", []);
    pyodide.globals.set("step_counter", 0);

    // Modified Python code with step tracking
    const instrumentedCode = instrumentPythonCode(code);

    try {
      // Execute the instrumented Python code
      pyodide.runPython(instrumentedCode);
      
      // Get captured steps
      const capturedSteps = pyodide.globals.get("captured_steps").toJs();
      
      capturedSteps.forEach((step: any, index: number) => {
        steps.push({
          step: index,
          line: step.line_number || 0,
          scope: step.variables || {},
          issues: [],
        });
      });

    } catch (error) {
      console.error('Python execution error:', error);
      throw error;
    }

    return steps;
  },
}));

function instrumentPythonCode(code: string): string {
  // Add step tracking to Python code
  const instrumentedCode = `
import sys
import traceback
import copy

# Global variables to track execution
captured_steps = []
step_counter = 0

def capture_step(line_number=0, local_vars=None, description=""):
    global captured_steps, step_counter
    
    # Get current frame variables
    frame = sys._getframe(1)
    variables = {}
    
    # Capture local variables
    for key, value in frame.f_locals.items():
        if not key.startswith('_') and key not in ['capture_step', 'captured_steps', 'step_counter']:
            try:
                # Only capture serializable values
                if isinstance(value, (int, float, str, bool, list, dict, tuple)):
                    variables[key] = copy.deepcopy(value)
                else:
                    variables[key] = str(value)
            except:
                variables[key] = str(type(value))
    
    # Capture global variables
    for key, value in frame.f_globals.items():
        if not key.startswith('_') and key not in ['capture_step', 'captured_steps', 'step_counter'] and key not in frame.f_locals:
            try:
                if isinstance(value, (int, float, str, bool, list, dict, tuple)):
                    variables[key] = copy.deepcopy(value)
                else:
                    variables[key] = str(value)
            except:
                variables[key] = str(type(value))
    
    step_data = {
        'line_number': line_number,
        'variables': variables,
        'description': description,
        '__log': local_vars.get('__log', []) if local_vars else []
    }
    
    captured_steps.append(step_data)
    step_counter += 1

# Override print to capture outputs
original_print = print
def traced_print(*args, **kwargs):
    # Capture what was printed
    frame = sys._getframe(1)
    if '__log' not in frame.f_locals:
        frame.f_locals['__log'] = []
    frame.f_locals['__log'].extend(args)
    
    capture_step(frame.f_lineno, frame.f_locals, f"Print: {' '.join(map(str, args))}")
    return original_print(*args, **kwargs)

print = traced_print

# Instrument the original code
${addStepTracking(code)}

# Make sure we capture the final state
capture_step(0, {}, "Execution completed")
`;

  return instrumentedCode;
}

function addStepTracking(code: string): string {
  const lines = code.split('\n');
  const instrumentedLines: string[] = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const lineNumber = index + 1;
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      instrumentedLines.push(line);
      return;
    }
    
    // Add step tracking before significant statements
    if (isSignificantStatement(trimmedLine)) {
      instrumentedLines.push(line);
      instrumentedLines.push(`    capture_step(${lineNumber}, locals(), "Execute: ${trimmedLine.replace(/"/g, '\\"')}")`);
    } else {
      instrumentedLines.push(line);
    }
  });
  
  return instrumentedLines.join('\n');
}

function isSignificantStatement(line: string): boolean {
  const significantPatterns = [
    /^\s*\w+\s*=/, // Assignment
    /^\s*print\s*\(/, // Print statement
    /^\s*if\s+/, // If statement
    /^\s*for\s+/, // For loop
    /^\s*while\s+/, // While loop
    /^\s*def\s+/, // Function definition
    /^\s*class\s+/, // Class definition
    /^\s*return\s+/, // Return statement
    /^\s*\w+\s*\([^)]*\)\s*$/ // Function call
  ];
  
  return significantPatterns.some(pattern => pattern.test(line));
}