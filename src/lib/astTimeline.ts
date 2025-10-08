import type Parser from 'web-tree-sitter';
import { AstExecutionStep, LinterIssue, Language } from '@/types';

/**
 * Creates a timeline that simulates code execution flow for debugging
 * This generates steps that represent the actual execution order of code
 */
export function createAstTimeline(
  ast: Parser.Tree,
  language: Language,
  linterIssues: LinterIssue[]
): AstExecutionStep[] {
  const steps: AstExecutionStep[] = [];
  const executionFlow = getExecutionFlow(ast.rootNode, language);
  
  executionFlow.forEach((flowStep, index) => {
    steps.push({
      step: index,
      node: flowStep.node,
      issues: flowStep.issues || [],
      executionContext: {
        phase: flowStep.phase,
        description: flowStep.description,
        lineNumber: getLineNumber(flowStep.node),
        codeSnippet: getCodeSnippet(flowStep.node),
        variables: flowStep.variables || {}
      }
    });
  });

  return steps;
}

interface ExecutionFlowStep {
  node: Parser.SyntaxNode;
  phase: 'declaration' | 'initialization' | 'execution' | 'call' | 'return' | 'condition' | 'loop' | 'assignment';
  description: string;
  issues?: LinterIssue[];
  variables?: Record<string, any>;
}

/**
 * Simulates the execution flow of code by analyzing the AST in execution order
 */
function getExecutionFlow(rootNode: Parser.SyntaxNode, language: Language): ExecutionFlowStep[] {
  const flow: ExecutionFlowStep[] = [];
  const declaredVariables: Record<string, any> = {};
  const declaredFunctions: string[] = [];

  // First pass: collect declarations
  collectDeclarations(rootNode, language, flow, declaredVariables, declaredFunctions);
  
  // Second pass: simulate execution order
  simulateExecution(rootNode, language, flow, declaredVariables, declaredFunctions);

  return flow;
}

function collectDeclarations(
  node: Parser.SyntaxNode, 
  language: Language, 
  flow: ExecutionFlowStep[],
  variables: Record<string, any>,
  functions: string[]
) {
  switch (language) {
    case 'python':
      collectPythonDeclarations(node, flow, variables, functions);
      break;
    case 'go':
      collectGoDeclarations(node, flow, variables, functions);
      break;
    case 'rust':
      collectRustDeclarations(node, flow, variables, functions);
      break;
    case 'cpp':
      collectCppDeclarations(node, flow, variables, functions);
      break;
  }
}

function simulateExecution(
  node: Parser.SyntaxNode,
  language: Language,
  flow: ExecutionFlowStep[],
  variables: Record<string, any>,
  functions: string[]
) {
  // Find main entry point and simulate execution from there
  const entryPoint = findEntryPoint(node, language);
  if (entryPoint) {
    simulateExecutionFromNode(entryPoint, language, flow, variables, functions);
  }
}

function collectPythonDeclarations(node: Parser.SyntaxNode, flow: ExecutionFlowStep[], variables: Record<string, any>, functions: string[]) {
  function traverse(n: Parser.SyntaxNode) {
    switch (n.type) {
      case 'function_definition':
        const funcName = getFunctionName(n);
        if (funcName && funcName !== 'main') {
          functions.push(funcName);
          flow.push({
            node: n,
            phase: 'declaration',
            description: `Define function ${funcName}`,
            variables: { ...variables }
          });
        }
        break;
      case 'class_definition':
        const className = getClassName(n);
        if (className) {
          flow.push({
            node: n,
            phase: 'declaration',
            description: `Define class ${className}`,
            variables: { ...variables }
          });
        }
        break;
    }
    
    for (const child of n.children) {
      traverse(child);
    }
  }
  
  traverse(node);
}

function collectGoDeclarations(node: Parser.SyntaxNode, flow: ExecutionFlowStep[], variables: Record<string, any>, functions: string[]) {
  function traverse(n: Parser.SyntaxNode) {
    switch (n.type) {
      case 'function_declaration':
        const funcName = getFunctionName(n);
        if (funcName && funcName !== 'main') {
          functions.push(funcName);
          flow.push({
            node: n,
            phase: 'declaration',
            description: `Declare function ${funcName}`,
            variables: { ...variables }
          });
        }
        break;
      case 'type_declaration':
        const typeName = getTypeName(n);
        if (typeName) {
          flow.push({
            node: n,
            phase: 'declaration',
            description: `Declare type ${typeName}`,
            variables: { ...variables }
          });
        }
        break;
    }
    
    for (const child of n.children) {
      traverse(child);
    }
  }
  
  traverse(node);
}

function collectRustDeclarations(node: Parser.SyntaxNode, flow: ExecutionFlowStep[], variables: Record<string, any>, functions: string[]) {
  function traverse(n: Parser.SyntaxNode) {
    switch (n.type) {
      case 'function_item':
        const funcName = getFunctionName(n);
        if (funcName && funcName !== 'main') {
          functions.push(funcName);
          flow.push({
            node: n,
            phase: 'declaration',
            description: `Define function ${funcName}`,
            variables: { ...variables }
          });
        }
        break;
      case 'struct_item':
        const structName = getStructName(n);
        if (structName) {
          flow.push({
            node: n,
            phase: 'declaration',
            description: `Define struct ${structName}`,
            variables: { ...variables }
          });
        }
        break;
    }
    
    for (const child of n.children) {
      traverse(child);
    }
  }
  
  traverse(node);
}

function collectCppDeclarations(node: Parser.SyntaxNode, flow: ExecutionFlowStep[], variables: Record<string, any>, functions: string[]) {
  function traverse(n: Parser.SyntaxNode) {
    switch (n.type) {
      case 'function_definition':
        const funcName = getFunctionName(n);
        if (funcName && funcName !== 'main') {
          functions.push(funcName);
          flow.push({
            node: n,
            phase: 'declaration',
            description: `Define function ${funcName}`,
            variables: { ...variables }
          });
        }
        break;
      case 'class_specifier':
        const className = getClassName(n);
        if (className) {
          flow.push({
            node: n,
            phase: 'declaration',
            description: `Define class ${className}`,
            variables: { ...variables }
          });
        }
        break;
    }
    
    for (const child of n.children) {
      traverse(child);
    }
  }
  
  traverse(node);
}

function findEntryPoint(node: Parser.SyntaxNode, language: Language): Parser.SyntaxNode | null {
  function traverse(n: Parser.SyntaxNode): Parser.SyntaxNode | null {
    // Look for main function or entry point
    if (n.type === 'function_definition' || n.type === 'function_declaration' || n.type === 'function_item') {
      const name = getFunctionName(n);
      if (name === 'main') {
        return n;
      }
    }
    
    // For Python, also look for if __name__ == "__main__"
    if (language === 'python' && n.type === 'if_statement') {
      const condition = n.children.find(child => child.type === 'comparison_operator');
      if (condition && condition.text.includes('__name__')) {
        return n;
      }
    }
    
    for (const child of n.children) {
      const result = traverse(child);
      if (result) return result;
    }
    
    return null;
  }
  
  return traverse(node);
}

function simulateExecutionFromNode(
  entryNode: Parser.SyntaxNode,
  language: Language,
  flow: ExecutionFlowStep[],
  variables: Record<string, any>,
  functions: string[]
) {
  flow.push({
    node: entryNode,
    phase: 'execution',
    description: `Start execution of ${getFunctionName(entryNode) || 'main'}`,
    variables: { ...variables }
  });

  // Simulate execution of statements in order
  const statements = getExecutableStatements(entryNode, language);
  statements.forEach((stmt, index) => {
    const stepInfo = analyzeStatement(stmt, language, variables);
    flow.push({
      node: stmt,
      phase: stepInfo.phase,
      description: stepInfo.description,
      variables: { ...stepInfo.variables }
    });
  });
}

function getExecutableStatements(node: Parser.SyntaxNode, language: Language): Parser.SyntaxNode[] {
  const statements: Parser.SyntaxNode[] = [];
  
  function traverse(n: Parser.SyntaxNode) {
    const executableTypes = getExecutableNodeTypes(language);
    
    if (executableTypes.includes(n.type)) {
      statements.push(n);
    }
    
    // For compound statements, traverse children
    if (n.type.includes('block') || n.type.includes('body') || n.type.includes('suite')) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }
  
  traverse(node);
  return statements;
}

function getExecutableNodeTypes(language: Language): string[] {
  const common = ['assignment_expression', 'call_expression', 'return_statement'];
  
  switch (language) {
    case 'python':
      return [...common, 'assignment', 'call', 'expression_statement', 'for_statement', 'if_statement'];
    case 'go':
      return [...common, 'assignment_statement', 'short_var_declaration', 'for_statement', 'if_statement'];
    case 'rust':
      return [...common, 'let_declaration', 'for_expression', 'if_expression', 'expression_statement'];
    case 'cpp':
      return [...common, 'declaration', 'for_statement', 'if_statement', 'expression_statement'];
    default:
      return common;
  }
}

function analyzeStatement(node: Parser.SyntaxNode, language: Language, variables: Record<string, any>) {
  const newVariables = { ...variables };
  
  switch (node.type) {
    case 'assignment':
    case 'assignment_expression':
    case 'assignment_statement':
      const varName = getVariableName(node);
      const value = getAssignedValue(node);
      if (varName) {
        newVariables[varName] = value;
        return {
          phase: 'assignment' as const,
          description: `Assign ${value} to ${varName}`,
          variables: newVariables
        };
      }
      break;
      
    case 'call_expression':
    case 'call':
      const funcName = getCallTarget(node);
      return {
        phase: 'call' as const,
        description: `Call function ${funcName}`,
        variables: newVariables
      };
      
    case 'for_statement':
    case 'for_expression':
      return {
        phase: 'loop' as const,
        description: 'Execute for loop',
        variables: newVariables
      };
      
    case 'if_statement':
    case 'if_expression':
      return {
        phase: 'condition' as const,
        description: 'Evaluate if condition',
        variables: newVariables
      };
  }
  
  return {
    phase: 'execution' as const,
    description: `Execute ${node.type}`,
    variables: newVariables
  };
}

// Helper functions
function getFunctionName(node: Parser.SyntaxNode): string | null {
  const identifier = node.children.find(child => child.type === 'identifier');
  return identifier ? identifier.text : null;
}

function getClassName(node: Parser.SyntaxNode): string | null {
  const identifier = node.children.find(child => child.type === 'identifier' || child.type === 'type_identifier');
  return identifier ? identifier.text : null;
}

function getStructName(node: Parser.SyntaxNode): string | null {
  const identifier = node.children.find(child => child.type === 'type_identifier');
  return identifier ? identifier.text : null;
}

function getTypeName(node: Parser.SyntaxNode): string | null {
  const identifier = node.children.find(child => child.type === 'type_identifier');
  return identifier ? identifier.text : null;
}

function getVariableName(node: Parser.SyntaxNode): string | null {
  const identifier = node.children.find(child => child.type === 'identifier');
  return identifier ? identifier.text : null;
}

function getAssignedValue(node: Parser.SyntaxNode): string {
  // Simplified - in a real implementation, we'd evaluate the expression
  return node.text.split('=')[1]?.trim() || 'unknown';
}

function getCallTarget(node: Parser.SyntaxNode): string {
  const identifier = node.children.find(child => child.type === 'identifier');
  return identifier ? identifier.text : 'unknown';
}

function getLineNumber(node: Parser.SyntaxNode): number {
  return node.startPosition.row + 1;
}

function getCodeSnippet(node: Parser.SyntaxNode): string {
  return node.text.split('\n')[0].trim();
}