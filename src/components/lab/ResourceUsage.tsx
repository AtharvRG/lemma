import React from 'react';
import { useProjectStore } from '@/hooks/useProjectStore';
import { Cpu, Activity } from 'lucide-react';

export function ResourceUsage() {
  const { executionSteps, currentStepIndex } = useProjectStore();
  if (!executionSteps.length) return null;

  const lastStep = executionSteps[executionSteps.length - 1] as any;
  // Compute final output by preferring __finalOutput on last step, otherwise aggregate __log across all steps
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

  const finalOutput = computeTerminalFinalOutput(executionSteps as any[]);

  // Simulated metrics (we don't have real profiler hooks). These are derived from execution steps.
  const execTimeMs = (executionSteps.length * 25); // 25ms per step estimate
  const outputSize = finalOutput ? new Blob([String(finalOutput)]).size : 0;
  const approxMemoryKb = Math.min(1024, Math.max(32, Math.round((executionSteps.length * 2) + (outputSize / 50))));
  const peakMemoryKb = Math.round(approxMemoryKb * 1.1);

  return (
    <div className="p-3 bg-[#17161b] rounded-md border border-white/6 text-xs text-gray-300">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-aquamarine" />
          <div>
            <div className="text-xs text-gray-400">Execution Time</div>
            <div className="text-sm font-medium text-white">{execTimeMs} ms</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-xs text-gray-400">Memory</div>
            <div className="text-sm font-medium text-white">{approxMemoryKb} KB</div>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400">Output Size</div>
          <div className="text-sm font-medium text-white">{outputSize} bytes</div>
        </div>
      </div>
    </div>
  );
}
