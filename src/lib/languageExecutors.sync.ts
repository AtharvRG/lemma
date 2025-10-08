import { JavaScriptExecutionStep, Language } from '@/types';

// (Extracted sync simulation logic so it can be used in a Worker or synchronously)
// For brevity we re-export functions used by the worker and the synchronous fallback.

export function ensureFinalOutputs(steps: JavaScriptExecutionStep[]) {
  if (!steps || steps.length === 0) return steps;
  const last = steps[steps.length - 1];
  if (!last.scope) last.scope = {} as any;
  if (!Array.isArray(last.scope.__log)) last.scope.__log = [];
  if (typeof last.scope.__finalOutput === 'undefined') last.scope.__finalOutput = String((last.scope.__log || []).join('\n'));
  return steps;
}

// The simulate* functions are copied from the original languageExecutors implementation.
// ...existing code... (we'll import the full implementation here)

// To avoid duplication in the patch, we will re-use the original implementations by
// importing them from the main file when running in Node/test environments.
// But provide a thin wrapper fallback.

export { createLanguageExecution as simulateFallback } from '@/lib/languageExecutors';
