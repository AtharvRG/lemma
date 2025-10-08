import { createLanguageExecution } from './languageExecutors';
import { JavaScriptExecutionStep, Language } from '@/types';

type ExecResult = JavaScriptExecutionStep[];

// Try to use a dedicated worker if present. In Node/test env this will fall back.
export async function runInWorker(code: string, language: Language): Promise<ExecResult> {
  // If running in browser and Worker is available, we could spin up a Worker.
  // For simplicity in this change, detect environment and fallback to synchronous call.
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    // fallback to synchronous
    return createLanguageExecution(code, language as any);
  }

  return new Promise<ExecResult>((resolve, reject) => {
    try {
      const worker = new Worker(new URL('../workers/languageWorker.ts', import.meta.url), { type: 'module' } as any);
      worker.onmessage = (evt) => {
        const data = evt.data;
        resolve(data.steps as ExecResult);
        worker.terminate();
      };
      worker.onerror = (err) => {
        worker.terminate();
        reject(err);
      };
      worker.postMessage({ code, language });
    } catch (e) {
      // If bundler doesn't support worker creation, fallback to sync
      resolve(createLanguageExecution(code, language as any));
    }
  });
}
