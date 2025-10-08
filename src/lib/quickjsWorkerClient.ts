import { JavaScriptExecutionStep } from '@/types';
import { useJsRunner } from '@/hooks/useJsRunner';
import { markStart, markEnd, recordDuration } from './telemetry';

type ExecResult = JavaScriptExecutionStep[];

let workerInstance: Worker | null = null;
let workerReady = false;
let workerInitPromise: Promise<void> | null = null;
let requestId = 0;
const pending = new Map<number, { resolve: (v: ExecResult) => void; reject: (e: any) => void; start: number }>();

function ensureWorker(): Promise<void> {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') return Promise.resolve();
  if (workerReady) return Promise.resolve();
  if (workerInitPromise) return workerInitPromise;

  markStart('quickjs.worker.startup');
  workerInitPromise = new Promise((resolve, reject) => {
    try {
      workerInstance = new Worker(new URL('../workers/quickjsWorker.ts', import.meta.url), { type: 'module' } as any);
      workerInstance.addEventListener('message', (evt: MessageEvent) => {
        const data = evt.data || {};
        const id = data.id;
        if (!id) return;
        const entry = pending.get(id);
        if (!entry) return;
        const { resolve, reject, start } = entry;
        pending.delete(id);
        if (data.error) {
          recordDuration('quickjs.worker.run', Date.now() - start);
          reject(data.error);
        } else {
          recordDuration('quickjs.worker.run', Date.now() - start);
          resolve(data.steps as ExecResult);
        }
      });
      workerReady = true;
      markEnd('quickjs.worker.startup');
      workerInitPromise = null;
      resolve();
    } catch (e) {
      workerInitPromise = null;
      workerInstance = null;
      workerReady = false;
      markEnd('quickjs.worker.startup');
      reject(e);
    }
  });
  return workerInitPromise;
}

export async function runJsInWorker(code: string): Promise<ExecResult> {
  // Worker unsupported -> fallback
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    const { runJsCode } = useJsRunner.getState();
    const t0 = Date.now();
    const res = await runJsCode(code);
    recordDuration('quickjs.sync.run', Date.now() - t0);
    return res;
  }

  await ensureWorker();
  if (!workerInstance) {
    // fallback
    const { runJsCode } = useJsRunner.getState();
    const t0 = Date.now();
    const res = await runJsCode(code);
    recordDuration('quickjs.sync.run', Date.now() - t0);
    return res;
  }

  return new Promise<ExecResult>((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, { resolve, reject, start: Date.now() });
    try {
      workerInstance!.postMessage({ id, code });
    } catch (e) {
      pending.delete(id);
      // fallback
      const { runJsCode } = useJsRunner.getState();
      runJsCode(code).then(resolve).catch(reject);
    }
  });
}

export function shutdownQuickJsWorker() {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
    workerReady = false;
  }
  pending.clear();
}

