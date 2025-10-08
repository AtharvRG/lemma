'use client';
import { useProjectStore } from '@/hooks/useProjectStore';
import { JavaScriptExecutionStep, LinterIssue, SyntaxNode, AstExecutionStep } from '@/types';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { memo } from 'react';
import { isEqual } from 'lodash';

const issueColors: Record<LinterIssue['type'], string> = {
  Perf: 'text-blue-400',
  Security: 'text-red-400',
  Style: 'text-yellow-400',
};

function renderAstNode(node: SyntaxNode, depth = 0) {
  // This function is now deprecated in favor of the new AstRenderer
  return (
    <div key={`${node.id}-${node.startIndex}`} style={{ marginLeft: `${depth * 1.5}rem` }}>
      <span className="text-cyan-400">{node.type}</span>
      <span className="text-gray-500 ml-2">[{node.startIndex}-{node.endIndex}]</span>
      {/* Removed recursive rendering to prevent overwhelming display */}
    </div>
  );
}

const ScopeEntry = memo(({ entryKey, entryValue, isHighlighted }: { entryKey: string, entryValue: any, isHighlighted: boolean }) => {
  const valueStr = JSON.stringify(entryValue, null, 2);
  const keyClass = isHighlighted ? 'text-aquamarine' : 'text-purple-400';
  const valueClass = isHighlighted ? 'text-aquamarine' : 'text-white';
  
  return (
    <div>
      <span className={keyClass}>&quot;{entryKey}&quot;</span>: <span className={valueClass}>{valueStr}</span>
    </div>
  );
});
ScopeEntry.displayName = 'ScopeEntry';

const ScopeRenderer = memo(({ scope, prevScope }: { scope: Record<string, any>, prevScope: Record<string, any> | null }) => {
  return (
    <pre className="text-white whitespace-pre-wrap text-xs leading-relaxed">
      {'{'}
      {Object.entries(scope).map(([key, value]) => {
        // hide internal/log keys from the variables panel
        if (!key || key.startsWith('__')) return null;
        const prevValue = prevScope ? prevScope[key] : undefined;
        const isHighlighted = !prevScope || !isEqual(value, prevValue);
        return (
          <div key={key} className="ml-4">
            <ScopeEntry entryKey={key} entryValue={value} isHighlighted={isHighlighted} />
          </div>
        );
      })}
      {'}'}
    </pre>
  );
});
ScopeRenderer.displayName = 'ScopeRenderer';

interface VariablesPanelProps {
  togglePanel: () => void;
}

export function VariablesPanel({ togglePanel }: VariablesPanelProps) {
  const { language, executionSteps, currentStepIndex, ast } = useProjectStore();
  
  const currentStep = executionSteps[currentStepIndex];
  const prevStep = executionSteps[currentStepIndex - 1];
  
  // Check if current step is JavaScript-style (has line property but no node)
  const isJavaScriptStep = currentStep && 'line' in currentStep && !('node' in currentStep);
  const isAstStep = currentStep && 'node' in currentStep;
  
  // history/log outputs removed; only variables are shown
  const issues = currentStep?.issues || [];

  // Get the current AST node for AST-based steps
  const currentAstNode = isAstStep ? (currentStep as AstExecutionStep)?.node : null;

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex-shrink-0 h-12 flex items-center justify-between pl-3 pr-2 border-b border-gray-800">
        <div />
        <button onClick={togglePanel} className="p-1 rounded hover:bg-gray-800" title="Collapse Panel">
            <ChevronRight className="w-4 h-4 text-gray-400"/>
        </button>
      </div>
      <div className="flex-grow p-4 overflow-y-auto font-mono text-sm min-h-0">
        {issues.length > 0 && (
          <div className="mb-4 p-2 bg-gray-800 rounded-md border border-gray-700 font-sans">
            <p className="text-xs text-gray-400 mb-2 uppercase font-bold tracking-wider">Linter Issues</p>
            {issues.map((issue, i) => (
              <div key={i} className={`flex items-start gap-2 text-xs ${issueColors[issue.type]}`}>
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span><strong>{issue.type}:</strong> {issue.message}</span>
              </div>
            ))}
          </div>
        )}

        {isJavaScriptStep && currentStep && (
          <div>
            <p className="text-xs text-gray-400 mb-2 uppercase font-bold tracking-wider">Variables</p>
            <ScopeRenderer 
              scope={(currentStep as JavaScriptExecutionStep).scope} 
              prevScope={prevStep && 'scope' in prevStep ? (prevStep as JavaScriptExecutionStep).scope : null} 
            />
          </div>
        )}
        {isAstStep && currentAstNode && (
          <div>
            {/* Only show variables for AST steps (remove execution/context history) */}
            {Object.keys((currentStep as AstExecutionStep).executionContext?.variables || {}).length > 0 && (
              <div className="mt-1">
                <p className="text-xs text-gray-400 mb-1 uppercase font-bold tracking-wider">Variables</p>
                <div className="space-y-1">
                  {Object.entries((currentStep as AstExecutionStep).executionContext?.variables || {})
                    .filter(([k]) => k && !k.startsWith('__'))
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className="text-purple-400">{key}:</span>
                        <span className="text-white">{String(value)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Fallback for when no step is available */}
        {!currentStep && (
          <p className="text-gray-500">Run the code to see variables and execution state.</p>
        )}
      </div>
    </div>
  );
}
