import { JavaScriptExecutionStep, Language } from '@/types';

/**
 * Creates execution steps that mimic JavaScript's behavior for other languages
 * by simulating code execution line by line with variable tracking
 */
export function createLanguageExecution(code: string, language: Language): JavaScriptExecutionStep[] {
  switch (language) {
    case 'python':
      return ensureFinalOutputs(simulatePythonExecution(code));
    case 'go':
      return ensureFinalOutputs(simulateGoExecution(code));
    case 'rust':
      return ensureFinalOutputs(simulateRustExecution(code));
    case 'cpp':
      return ensureFinalOutputs(simulateCppExecution(code));
    default:
      return [];
  }
}

// Ensure parity: last step should always include __log and __finalOutput
function ensureFinalOutputs(steps: JavaScriptExecutionStep[]) {
  if (!steps || steps.length === 0) return steps;
  const last = steps[steps.length - 1];
  if (!last.scope) last.scope = {} as any;
  // Build aggregated logs across all steps (steps may provide incremental __log arrays)
  const allLogs: any[] = [];
  for (const s of steps) {
    if (s && s.scope && Array.isArray(s.scope.__log)) {
      allLogs.push(...s.scope.__log);
    }
  }
  if (!Array.isArray(last.scope.__log)) last.scope.__log = allLogs;
  if (typeof last.scope.__finalOutput === 'undefined') last.scope.__finalOutput = String(allLogs.map((v: any) => (typeof v === 'string' ? v : JSON.stringify(v))).join('\n'));
  return steps;
}

function simulatePythonExecution(code: string): JavaScriptExecutionStep[] {
  const steps: JavaScriptExecutionStep[] = [];
  const lines = code.split('\n');
  const variables: Record<string, any> = {};
  const outputs: any[] = [];
  let stepCounter = 0;

  // Track previous outputs count to emit incremental __log per step
  let prevOutputsLen = 0;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const lineNumber = index + 1;

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) return;

    // Enhanced variable assignments with expression evaluation
    if (trimmedLine.includes('=') && !trimmedLine.startsWith('if') && !trimmedLine.startsWith('for')) {
      const assignment = parseAssignment(trimmedLine);
      if (assignment) {
        // Try to evaluate expressions like "a + b"
        const evaluatedValue = evaluatePythonExpression(assignment.value, variables);
        variables[assignment.variable] = evaluatedValue;
        steps.push({
          step: stepCounter++,
          line: lineNumber,
          scope: { ...variables, __log: [], __finalOutput: outputs.join('\n') },
          issues: []
        });
      }
    }

    // Enhanced print statements with variable resolution
    if (trimmedLine.includes('print(')) {
      const printValue = extractPrintValue(trimmedLine, variables);
      const resolvedValue = resolvePythonValue(printValue, variables);
      outputs.push(resolvedValue);
      const newLogs = outputs.slice(prevOutputsLen);
      prevOutputsLen = outputs.length;
      steps.push({
        step: stepCounter++,
        line: lineNumber,
        scope: { ...variables, __log: [...newLogs], __finalOutput: outputs.join('\n') },
        issues: []
      });
    }

    // Simulate function calls
    if (trimmedLine.includes('(') && !trimmedLine.includes('print') && !trimmedLine.includes('=')) {
      steps.push({
        step: stepCounter++,
        line: lineNumber,
        scope: { ...variables, __log: [], __finalOutput: outputs.join('\n') },
        issues: []
      });
    }

    // Simulate control structures
    if (trimmedLine.startsWith('if') || trimmedLine.startsWith('for') || trimmedLine.startsWith('while')) {
      steps.push({
        step: stepCounter++,
        line: lineNumber,
        scope: { ...variables, __log: [...outputs], __finalOutput: outputs.join('\n') },
        issues: []
      });
    }
  });

  return steps;
}

function simulateGoExecution(code: string): JavaScriptExecutionStep[] {
  const steps: JavaScriptExecutionStep[] = [];
  const lines = code.split('\n');
  const variables: Record<string, any> = {};
  const outputs: any[] = [];
  let stepCounter = 0;
  let inMain = false;
  let prevOutputsLen = 0;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const lineNumber = index + 1;

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('//')) return;

    // Track when we enter main function
    if (trimmedLine.includes('func main()')) {
      inMain = true;
      steps.push({
        step: stepCounter++,
        line: lineNumber,
        scope: { ...variables, __log: [...outputs] },
        issues: []
      });
      return;
    }

    // Only simulate execution inside main
    if (!inMain) return;

    // Simulate variable declarations with enhanced evaluation
    if (trimmedLine.includes(':=') || (trimmedLine.includes('var ') && trimmedLine.includes('='))) {
      const assignment = parseGoAssignment(trimmedLine);
      if (assignment) {
        const evaluatedValue = evaluateGoExpression(assignment.value, variables);
        variables[assignment.variable] = evaluatedValue;
        steps.push({
          step: stepCounter++,
          line: lineNumber,
          scope: { ...variables, __log: [], __finalOutput: outputs.join('\n') },
          issues: []
        });
      }
    }

    // Simulate fmt.Println with variable resolution
    if (trimmedLine.includes('fmt.Println(')) {
      const printValue = extractGoPrintValue(trimmedLine, variables);
      const resolvedValue = resolveGoValue(printValue, variables);
      outputs.push(resolvedValue);
      const newLogs = outputs.slice(prevOutputsLen);
      prevOutputsLen = outputs.length;
      steps.push({
        step: stepCounter++,
        line: lineNumber,
        scope: { ...variables, __log: [...newLogs], __finalOutput: outputs.join('\n') },
        issues: []
      });
    }

    // Simulate loops and conditions
    if (trimmedLine.startsWith('for ') || trimmedLine.startsWith('if ')) {
      steps.push({
        step: stepCounter++,
        line: lineNumber,
        scope: { ...variables, __log: [], __finalOutput: outputs.join('\n') },
        issues: []
      });
    }
  });

  return steps;
}

function simulateRustExecution(code: string): JavaScriptExecutionStep[] {
  const steps: JavaScriptExecutionStep[] = [];
  const lines = code.split('\n');
  const variables: Record<string, any> = {};
  const outputs: any[] = [];
  let stepCounter = 0;
  let inMain = false;
  let prevOutputsLen = 0;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const lineNumber = index + 1;

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('//')) return;

    // Track when we enter main function
    if (trimmedLine.includes('fn main()')) {
      inMain = true;
      steps.push({
        step: stepCounter++,
        line: lineNumber,
        scope: { ...variables, __log: [...outputs] },
        issues: []
      });
      return;
    }

    // Only simulate execution inside main
    if (!inMain) return;

    // Simulate let bindings with enhanced evaluation
    if (trimmedLine.startsWith('let ')) {
      const assignment = parseRustAssignment(trimmedLine);
      if (assignment) {
        const evaluatedValue = evaluateRustExpression(assignment.value, variables);
        variables[assignment.variable] = evaluatedValue;
        steps.push({
          step: stepCounter++,
          line: lineNumber,
          scope: { ...variables, __log: [], __finalOutput: outputs.join('\n') },
          issues: []
        });
      }
    }

    // Simulate println! macro with variable resolution
    if (trimmedLine.includes('println!(')) {
      const printValue = extractRustPrintValue(trimmedLine, variables);
      const resolvedValue = resolveRustValue(printValue, variables);
      outputs.push(resolvedValue);
      const newLogs = outputs.slice(prevOutputsLen);
      prevOutputsLen = outputs.length;
      steps.push({
        step: stepCounter++,
        line: lineNumber,
        scope: { ...variables, __log: [...newLogs], __finalOutput: outputs.join('\n') },
        issues: []
      });
    }

    // Simulate control structures
    if (trimmedLine.startsWith('if ') || trimmedLine.startsWith('for ') || trimmedLine.startsWith('while ')) {
      steps.push({
        step: stepCounter++,
        line: lineNumber,
        scope: { ...variables, __log: [], __finalOutput: outputs.join('\n') },
        issues: []
      });
    }
  });

  return steps;
}

function simulateCppExecution(code: string): JavaScriptExecutionStep[] {
  const steps: JavaScriptExecutionStep[] = [];
  const lines = code.split('\n');
  const variables: Record<string, any> = {};
  const outputs: any[] = [];
  let stepCounter = 0;
  let inMain = false;
  let prevOutputsLen = 0;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const lineNumber = index + 1;

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('//')) return;

    // Track when we enter main function
    if (trimmedLine.includes('int main()')) {
      inMain = true;
      steps.push({
        step: stepCounter++,
        line: lineNumber,
        scope: { ...variables, __log: [...outputs] },
        issues: []
      });
      return;
    }

    // Only simulate execution inside main
    if (!inMain) return;

    // Simulate variable declarations with enhanced evaluation
    if (isVariableDeclaration(trimmedLine)) {
      const assignment = parseCppAssignment(trimmedLine);
      if (assignment) {
        const evaluatedValue = evaluateCppExpression(assignment.value, variables);
        variables[assignment.variable] = evaluatedValue;
        steps.push({
          step: stepCounter++,
          line: lineNumber,
          scope: { ...variables, __log: [], __finalOutput: outputs.join('\n') },
          issues: []
        });
      }
    }

    // Simulate std::cout with variable resolution
    if (trimmedLine.includes('std::cout')) {
      const printValue = extractCppPrintValue(trimmedLine, variables);
      const resolvedValue = resolveCppValue(printValue, variables);
      outputs.push(resolvedValue);
      const newLogs = outputs.slice(prevOutputsLen);
      prevOutputsLen = outputs.length;
      steps.push({
        step: stepCounter++,
        line: lineNumber,
        scope: { ...variables, __log: [...newLogs], __finalOutput: outputs.join('\n') },
        issues: []
      });
    }

    // Simulate control structures
    if (trimmedLine.startsWith('if ') || trimmedLine.startsWith('for ') || trimmedLine.startsWith('while ')) {
      steps.push({
        step: stepCounter++,
        line: lineNumber,
        scope: { ...variables, __log: [], __finalOutput: outputs.join('\n') },
        issues: []
      });
    }
  });

  return steps;
}

// Helper functions for parsing assignments and values
function parseAssignment(line: string): { variable: string; value: any } | null {
  const match = line.match(/(\w+)\s*=\s*(.+)/);
  if (match) {
    const variable = match[1];
    const valueStr = match[2].trim();
    let value: any = valueStr;

    // Try to parse as number
    if (!isNaN(Number(valueStr)) && valueStr !== '') {
      value = Number(valueStr);
    }
    // Try to parse as string literal
    else if ((valueStr.startsWith('"') && valueStr.endsWith('"')) || 
             (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
      value = valueStr.slice(1, -1);
    }
    // Try to parse as boolean
    else if (valueStr === 'True' || valueStr === 'False') {
      value = valueStr === 'True';
    }
    // Keep as expression for evaluation
    else {
      value = valueStr;
    }

    return { variable, value };
  }
  return null;
}

function parseGoAssignment(line: string): { variable: string; value: any } | null {
  const shortMatch = line.match(/(\w+)\s*:=\s*(.+)/);
  if (shortMatch) {
    return { variable: shortMatch[1], value: parseGoValue(shortMatch[2]) };
  }
  
  const varMatch = line.match(/var\s+(\w+)\s+\w+\s*=\s*(.+)/);
  if (varMatch) {
    return { variable: varMatch[1], value: parseGoValue(varMatch[2]) };
  }
  
  return null;
}

function parseRustAssignment(line: string): { variable: string; value: any } | null {
  const match = line.match(/let\s+(\w+)\s*=\s*(.+);/);
  if (match) {
    return { variable: match[1], value: parseRustValue(match[2]) };
  }
  return null;
}

function parseCppAssignment(line: string): { variable: string; value: any } | null {
  const match = line.match(/\w+\s+(\w+)\s*=\s*(.+);/);
  if (match) {
    return { variable: match[1], value: parseCppValue(match[2]) };
  }
  return null;
}

function extractPrintValue(line: string, variables: Record<string, any>): any {
  const match = line.match(/print\((.+)\)/);
  if (match) {
    const arg = match[1].trim();
    
    // Handle string concatenation and f-strings (basic)
    if (arg.includes('+')) {
      let result = '';
      const parts = arg.split('+').map(p => p.trim());
      parts.forEach(part => {
        if (part in variables) {
          result += String(variables[part]);
        } else if (part.startsWith('"') && part.endsWith('"')) {
          result += part.slice(1, -1);
        } else if (part.startsWith("'") && part.endsWith("'")) {
          result += part.slice(1, -1);
        } else {
          result += part;
        }
      });
      return result;
    }
    
    // Handle variable reference
    if (arg in variables) {
      return variables[arg];
    }
    
    // Handle string literals
    if ((arg.startsWith('"') && arg.endsWith('"')) || 
        (arg.startsWith("'") && arg.endsWith("'"))) {
      return arg.slice(1, -1);
    }
    
    // Handle basic f-string format like print("Result:", result)
    if (arg.includes(',')) {
      const parts = arg.split(',').map(p => p.trim());
      let result = '';
      parts.forEach((part, index) => {
        if (index > 0) result += ' ';
        if (part in variables) {
          result += String(variables[part]);
        } else if ((part.startsWith('"') && part.endsWith('"')) || 
                   (part.startsWith("'") && part.endsWith("'"))) {
          result += part.slice(1, -1);
        } else {
          result += part;
        }
      });
      return result;
    }
    
    return arg.replace(/['"]/g, '');
  }
  return '';
}

function extractGoPrintValue(line: string, variables: Record<string, any>): any {
  const match = line.match(/fmt\.Println\((.+)\)/);
  if (match) {
    const arg = match[1].trim();
    if (arg in variables) {
      return variables[arg];
    }
    return arg.replace(/['"]/g, '');
  }
  return '';
}

function extractRustPrintValue(line: string, variables: Record<string, any>): any {
  const match = line.match(/println!\((.+)\)/);
  if (match) {
    const arg = match[1].trim().replace(/['"]/g, '');
    return arg;
  }
  return '';
}

function extractCppPrintValue(line: string, variables: Record<string, any>): any {
  const match = line.match(/std::cout\s*<<\s*(.+)\s*<<\s*std::endl/);
  if (match) {
    const arg = match[1].trim();
    if (arg in variables) {
      return variables[arg];
    }
    return arg.replace(/['"]/g, '');
  }
  return '';
}

function parseGoValue(valueStr: string): any {
  const trimmed = valueStr.trim();
  if (!isNaN(Number(trimmed))) return Number(trimmed);
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
  if (trimmed === 'true' || trimmed === 'false') return trimmed === 'true';
  return trimmed;
}

function parseRustValue(valueStr: string): any {
  const trimmed = valueStr.trim();
  if (!isNaN(Number(trimmed))) return Number(trimmed);
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
  if (trimmed === 'true' || trimmed === 'false') return trimmed === 'true';
  return trimmed;
}

function parseCppValue(valueStr: string): any {
  const trimmed = valueStr.trim();
  if (!isNaN(Number(trimmed))) return Number(trimmed);
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
  if (trimmed === 'true' || trimmed === 'false') return trimmed === 'true';
  return trimmed;
}

function isVariableDeclaration(line: string): boolean {
  return /^\s*(int|float|double|string|bool|auto|char)\s+\w+\s*=/.test(line) ||
         /^\s*std::string\s+\w+\s*=/.test(line);
}

// Enhanced expression evaluation for Python-like syntax
function evaluatePythonExpression(expression: any, variables: Record<string, any>): any {
  if (typeof expression !== 'string') return expression;
  
  const expr = expression.trim();
  
  // Handle simple arithmetic expressions like "a + b", "x * 2", etc.
  if (expr.includes('+') || expr.includes('-') || expr.includes('*') || expr.includes('/')) {
    try {
      // Replace variable names with their values
      let evaluatedExpr = expr;
      Object.keys(variables).forEach(varName => {
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        evaluatedExpr = evaluatedExpr.replace(regex, String(variables[varName]));
      });
      
      // Simple evaluation for basic arithmetic
      if (/^[\d\s\+\-\*\/\(\)\.]+$/.test(evaluatedExpr)) {
        return Function(`"use strict"; return (${evaluatedExpr})`)();
      }
    } catch (e) {
      // If evaluation fails, return the original expression
    }
  }
  
  // Check if it's a variable reference
  if (expr in variables) {
    return variables[expr];
  }
  
  // Try to parse as literal value
  if (!isNaN(Number(expr))) return Number(expr);
  if (expr.startsWith('"') && expr.endsWith('"')) return expr.slice(1, -1);
  if (expr.startsWith("'") && expr.endsWith("'")) return expr.slice(1, -1);
  if (expr === 'True' || expr === 'False') return expr === 'True';
  
  return expr;
}

function resolvePythonValue(value: any, variables: Record<string, any>): any {
  if (typeof value !== 'string') return value;
  
  // If it's a variable name, resolve it
  if (value in variables) {
    return variables[value];
  }
  
  return value;
}

// Go expression evaluation
function evaluateGoExpression(expression: any, variables: Record<string, any>): any {
  if (typeof expression !== 'string') return expression;
  
  const expr = expression.trim();
  
  // Handle simple arithmetic expressions
  if (expr.includes('+') || expr.includes('-') || expr.includes('*') || expr.includes('/')) {
    try {
      let evaluatedExpr = expr;
      Object.keys(variables).forEach(varName => {
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        evaluatedExpr = evaluatedExpr.replace(regex, String(variables[varName]));
      });
      
      if (/^[\d\s\+\-\*\/\(\)\.]+$/.test(evaluatedExpr)) {
        return Function(`"use strict"; return (${evaluatedExpr})`)();
      }
    } catch (e) {
      // If evaluation fails, return the original expression
    }
  }
  
  // Check if it's a variable reference
  if (expr in variables) {
    return variables[expr];
  }
  
  // Parse Go literals
  if (!isNaN(Number(expr))) return Number(expr);
  if (expr.startsWith('"') && expr.endsWith('"')) return expr.slice(1, -1);
  if (expr === 'true' || expr === 'false') return expr === 'true';
  
  return expr;
}

function resolveGoValue(value: any, variables: Record<string, any>): any {
  if (typeof value !== 'string') return value;
  
  if (value in variables) {
    return variables[value];
  }
  
  return value;
}

// Rust expression evaluation
function evaluateRustExpression(expression: any, variables: Record<string, any>): any {
  if (typeof expression !== 'string') return expression;
  
  const expr = expression.trim();
  
  // Handle simple arithmetic expressions
  if (expr.includes('+') || expr.includes('-') || expr.includes('*') || expr.includes('/')) {
    try {
      let evaluatedExpr = expr;
      Object.keys(variables).forEach(varName => {
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        evaluatedExpr = evaluatedExpr.replace(regex, String(variables[varName]));
      });
      
      if (/^[\d\s\+\-\*\/\(\)\.]+$/.test(evaluatedExpr)) {
        return Function(`"use strict"; return (${evaluatedExpr})`)();
      }
    } catch (e) {
      // If evaluation fails, return the original expression
    }
  }
  
  // Check if it's a variable reference
  if (expr in variables) {
    return variables[expr];
  }
  
  // Parse Rust literals
  if (!isNaN(Number(expr))) return Number(expr);
  if (expr.startsWith('"') && expr.endsWith('"')) return expr.slice(1, -1);
  if (expr === 'true' || expr === 'false') return expr === 'true';
  
  return expr;
}

function resolveRustValue(value: any, variables: Record<string, any>): any {
  if (typeof value !== 'string') return value;
  
  if (value in variables) {
    return variables[value];
  }
  
  return value;
}

// C++ expression evaluation
function evaluateCppExpression(expression: any, variables: Record<string, any>): any {
  if (typeof expression !== 'string') return expression;
  
  const expr = expression.trim();
  
  // Handle simple arithmetic expressions
  if (expr.includes('+') || expr.includes('-') || expr.includes('*') || expr.includes('/')) {
    try {
      let evaluatedExpr = expr;
      Object.keys(variables).forEach(varName => {
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        evaluatedExpr = evaluatedExpr.replace(regex, String(variables[varName]));
      });
      
      if (/^[\d\s\+\-\*\/\(\)\.]+$/.test(evaluatedExpr)) {
        return Function(`"use strict"; return (${evaluatedExpr})`)();
      }
    } catch (e) {
      // If evaluation fails, return the original expression
    }
  }
  
  // Check if it's a variable reference
  if (expr in variables) {
    return variables[expr];
  }
  
  // Parse C++ literals
  if (!isNaN(Number(expr))) return Number(expr);
  if (expr.startsWith('"') && expr.endsWith('"')) return expr.slice(1, -1);
  if (expr === 'true' || expr === 'false') return expr === 'true';
  
  return expr;
}

function resolveCppValue(value: any, variables: Record<string, any>): any {
  if (typeof value !== 'string') return value;
  
  if (value in variables) {
    return variables[value];
  }
  
  return value;
}