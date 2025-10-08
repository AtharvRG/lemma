import React from 'react';
import { useProjectStore } from '@/hooks/useProjectStore';
import { JavaScriptExecutionStep } from '@/types';
import { CheckCircle, Play, Clock, Variable, Clipboard } from 'lucide-react';
import { ResourceUsage } from './ResourceUsage';

interface ExecutionSummaryProps {
  hideProgress?: boolean;
}

export function ExecutionSummary({ hideProgress }: ExecutionSummaryProps) {
  const { executionSteps, currentStepIndex, language, run, reset, runHistory } = useProjectStore();

  const totalSteps = executionSteps.length;
  const isComplete = totalSteps > 0 && currentStepIndex === totalSteps - 1;

  const runsCount = (runHistory && runHistory.length) || 0;
  const lastRun = runsCount > 0 ? runHistory[0] : null;

  const currentStep = executionSteps[currentStepIndex];
  // Aggregate output up to the current step for all languages so output updates as the
  // timeline advances. Many language executors already push cumulative `__log` arrays
  // on each step; this ensures the UI shows the progressive output rather than only
  // the final output.
  let finalOutput: string | undefined = undefined;
  let variables: string[] = [];

  // Build a progressive output that follows the timeline.
  // Strategy:
  // - If a step's __log appears to be cumulative (a prefix relation to the
  //   next step), prefer the cumulative array for that step.
  // - Otherwise append new entries while deduping consecutive duplicates.
  const agg: any[] = [];
  for (let i = 0; i <= currentStepIndex; i++) {
    const s: any = executionSteps[i] as any;
    if (!s || !s.scope || !Array.isArray(s.scope.__log) || s.scope.__log.length === 0) continue;

    const curArr = s.scope.__log.map((v: any) => (typeof v === 'string' ? v : JSON.stringify(v)));

    // If next step exists and has a longer array that starts with curArr,
    // we can safely use the next step later. For now, try to detect if this
    // step is already cumulative relative to the previous aggregation.
    if (agg.length > 0) {
      // If curArr is a prefix of agg (shouldn't happen) or agg is prefix of curArr
      const aggStr = agg.map((v: any) => (typeof v === 'string' ? v : JSON.stringify(v)));
      if (aggStr.length <= curArr.length && aggStr.every((x: string, idx: number) => x === curArr[idx])) {
        // curArr already includes everything we've aggregated; replace with curArr to keep order
        agg.length = 0;
        agg.push(...curArr);
        continue;
      }
    }

    // Otherwise, append entries that are not equal to the last appended entry
    for (const entry of curArr) {
      const last = agg.length > 0 ? (typeof agg[agg.length - 1] === 'string' ? agg[agg.length - 1] : JSON.stringify(agg[agg.length - 1])) : null;
      if (last === entry) continue; // consecutive duplicate
      agg.push(entry);
    }
  }

  if (agg.length > 0) {
    finalOutput = agg.join('\n');
  } else {
    // Only show the final aggregated output when the timeline is at the last step.
    // This prevents the UI from immediately showing the full output right after
    // hitting Run (currentStepIndex initially set to 0). If no incremental logs
    // exist yet, show no output until steps produce logs or the user advances to
    // the final step.
    if (currentStepIndex === totalSteps - 1) {
      const lastStep = executionSteps[executionSteps.length - 1] as any;
      finalOutput = lastStep?.scope?.__finalOutput;
    } else {
      finalOutput = undefined;
    }
  }

  const step = currentStep as any;
  variables = step && step.scope ? Object.keys(step.scope).filter((k: string) => !k.startsWith('__') && k !== 'globalThis' && k !== 'console') : [];

  // Helper: compute terminal-style final output by preferring __finalOutput on the last step,
  // otherwise aggregating all __log entries across all steps.
  const computeTerminalFinalOutput = (steps: any[]): string => {
    if (!Array.isArray(steps) || steps.length === 0) return '';
    const last = steps[steps.length - 1] as any;
    if (last && last.scope && typeof last.scope.__finalOutput !== 'undefined' && String(last.scope.__finalOutput).length > 0) {
      return String(last.scope.__finalOutput);
    }
    const entries: string[] = [];
    for (const s of steps) {
      if (!s || !s.scope) continue;
      if (Array.isArray(s.scope.__log) && s.scope.__log.length > 0) {
        for (const v of s.scope.__log) {
          entries.push(typeof v === 'string' ? v : JSON.stringify(v));
        }
      }
    }
    return entries.join('\n');
  };

  return (
    <div className="mb-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700 h-full min-h-0 overflow-y-auto">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isComplete ? 'bg-green-400' : 'bg-blue-400'}`}></div>
          <h3 className="text-sm font-semibold text-white">
            {language.charAt(0).toUpperCase() + language.slice(1)} Execution Summary
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{totalSteps > 0 ? `Step ${currentStepIndex + 1} of ${totalSteps}` : 'Not run yet'}</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Progress */}
        {!hideProgress && (
          <div className="space-y-2 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Play className="w-3 h-3" />
              <span>Progress</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-300">
              {totalSteps > 0 ? `${Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% Complete` : 'No progress yet'}
            </p>
          </div>
        )}

        {/* Variables */}
        <div className="space-y-2 col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Variable className="w-3 h-3" />
            <span>Active Variables</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {variables.map(varName => (
              <span 
                key={varName}
                className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs border border-gray-600"
              >
                {varName}
              </span>
            ))}
            {variables.length === 0 && (
              <span className="text-xs text-gray-500">No variables yet</span>
            )}
          </div>
        </div>

        {/* Final Output */}
        <div className="space-y-2 col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle className="w-3 h-3" />
            <span>Output</span>
          </div>
          {finalOutput ? (
            <div className="bg-gray-900/50 rounded p-2 border border-gray-600">
              <pre className="text-xs text-emerald-300 whitespace-pre-wrap">
                {finalOutput}
              </pre>
            </div>
          ) : (
            <p className="text-xs text-gray-500">No output yet</p>
          )}
        </div>

        {/* Resource Usage */}
        <div className="col-span-1 md:col-span-4 mt-2">
          <ResourceUsage />
        </div>

        {/* Final Result (terminal-style final output independent of timeline) */}
        <div className="col-span-1 md:col-span-4 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clipboard className="w-3 h-3" />
              <span>Final Result</span>
            </div>
            <div>
              <button
                onClick={() => {
                  const txt = computeTerminalFinalOutput(executionSteps as any[]);
                  try {
                    if (txt) navigator.clipboard.writeText(txt);
                  } catch (e) {
                    // ignore clipboard errors
                  }
                }}
                className="px-3 py-1 bg-transparent border border-gray-600 rounded text-xs text-gray-300"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="mt-2 bg-gray-900/50 rounded p-2 border border-gray-600">
            <pre className="text-xs text-emerald-300 whitespace-pre-wrap">
              {(() => {
                const txt = computeTerminalFinalOutput(executionSteps as any[]);
                return txt && txt.length > 0 ? txt : 'No final result yet';
              })()}
            </pre>
          </div>
        </div>
      </div>

    </div>
  );
}
