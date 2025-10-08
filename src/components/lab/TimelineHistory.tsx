'use client';
import React from 'react';
import { JavaScriptExecutionStep, ExecutionStep, AstExecutionStep } from '@/types';

type Props = {
  executionSteps: ExecutionStep[];
  currentIndex: number;
};

function StepCard({ step, active }: { step: ExecutionStep; active: boolean }) {
  const isJs = (s: any) => 'line' in s && !('node' in s);
  const title = isJs(step) ? `Line ${(step as JavaScriptExecutionStep).line}` : (step as AstExecutionStep).node?.type || 'AST';
  const issues = (step as any).issues || [];

  return (
    <div className={`p-2 rounded-md border ${active ? 'border-aquamarine bg-[#062226]' : 'border-white/6 bg-[#0b0b10]'} w-full`}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-300 font-medium">{title}</div>
        <div className="flex items-center gap-2">
          {issues.slice(0,2).map((iss: any, i: number) => (
            <div key={i} className={`text-[10px] px-1 py-0.5 rounded ${iss.type === 'Perf' ? 'bg-blue-500' : iss.type === 'Security' ? 'bg-red-500' : 'bg-yellow-500'}`}>
              {iss.type}
            </div>
          ))}
        </div>
      </div>
      <div className="text-[11px] text-gray-400 mt-1 truncate">{(isJs(step) && (step as JavaScriptExecutionStep).scope) ? Object.keys((step as JavaScriptExecutionStep).scope).filter(k=>!k.startsWith('__')).slice(0,3).join(', ') : ''}</div>
    </div>
  );
}

export default function TimelineHistory({ executionSteps, currentIndex }: Props) {
  if (!executionSteps || executionSteps.length === 0) return null;

  // show last N steps
  const last = executionSteps.slice(Math.max(0, executionSteps.length - 6)).reverse();

  return (
    <div className="mt-3">
      <h4 className="text-xs text-gray-400 mb-2 font-semibold">Recent Steps</h4>
      <div className="grid grid-cols-2 gap-2">
        {last.map((s, idx) => (
          <StepCard key={idx} step={s} active={(executionSteps.length - 1 - idx) === currentIndex} />
        ))}
      </div>
    </div>
  );
}
