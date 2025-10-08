import { create } from 'zustand';
import { getQuickJS, QuickJSContext, QuickJSHandle } from 'quickjs-emscripten';
import { JavaScriptExecutionStep } from '@/types';
import debounce from 'lodash.debounce';
import { runJsInWorker } from '@/lib/quickjsWorkerClient';

type JsRunnerState = {
  vm: QuickJSContext | null,
  init: () => Promise<void>,
  runJsCode: (code: string) => Promise<JavaScriptExecutionStep[]>,
};

// Debounce re-initialization to prevent race conditions on rapid calls
const debouncedInit = debounce(async (set) => {
  try {
    const QuickJS = await getQuickJS();
    const vm = QuickJS.newContext();
    set({ vm });
    return vm;
  } catch (e) {
    console.error("Failed to initialize QuickJS VM", e);
    set({ vm: null });
    return null;
  }
}, 500, { leading: true, trailing: false });


export const useJsRunner = create<JsRunnerState>((set, get) => ({
  vm: null,
  init: async () => {
    if (get().vm) return;
    await debouncedInit(set);
  },
  runJsCode: async (code) => {
    // Helper: aggregate logs and ensure last step has __finalOutput
    const normalizeJsSteps = (steps: JavaScriptExecutionStep[]) => {
      if (!steps || steps.length === 0) return steps;
      const allLogs: any[] = [];
      for (const s of steps) {
        const l = s.scope?.__log;
        if (Array.isArray(l) && l.length > 0) {
          allLogs.push(...l);
        }
      }
      const last = steps[steps.length - 1];
      if (!last.scope) last.scope = {} as any;
      if (!Array.isArray(last.scope.__log)) last.scope.__log = allLogs;
      if (typeof last.scope.__finalOutput === 'undefined') last.scope.__finalOutput = String((last.scope.__log || []).map((v: any) => (typeof v === 'string' ? v : JSON.stringify(v))).join('\n'));
      return steps;
    };

    // Prefer worker-based QuickJS execution when available
    try {
      const raw = await runJsInWorker(code);
      return normalizeJsSteps(raw);
    } catch (e) {
      // Fallback to local synchronous execution if worker fails
      let { vm } = get();
  if (!vm) {
        console.log('VM not found or destroyed, re-initializing...');
        const QuickJS = await getQuickJS();
        vm = QuickJS.newContext();
        set({ vm });
      }

      const steps: JavaScriptExecutionStep[] = [];
      let stepCounter = 0;

      const consoleLogHandle = vm.newFunction('log', (...args) => {
        const globalScope = vm.dump(vm.global);
        const loggedObjects = args.map(argHandle => vm.dump(argHandle));
        const scope: Record<string, any> = {};
        for (const key in globalScope) {
          if (Object.prototype.hasOwnProperty.call(globalScope, key)) {
            if (typeof globalScope[key] !== 'function') {
              scope[key] = globalScope[key];
            }
          }
        }

        steps.push({ step: stepCounter++, line: 0, scope: { __log: loggedObjects, ...scope }, issues: [] });
        args.forEach(arg => arg.dispose());
      });

      const consoleHandle = vm.newObject();
      vm.setProp(consoleHandle, 'log', consoleLogHandle);
      vm.setProp(vm.global, 'console', consoleHandle);
      // Add a native snapshot function to capture per-line scope snapshots
      const snapshotHandle = vm.newFunction('__snapshot', (lineHandle) => {
        const lineVal = vm.dump(lineHandle);
        const lineNum = Number(lineVal) || 0;
        const globalScope = vm.dump(vm.global);
        const scope: Record<string, any> = {};
        for (const key in globalScope) {
          if (Object.prototype.hasOwnProperty.call(globalScope, key)) {
            if (typeof globalScope[key] !== 'function') {
              scope[key] = globalScope[key];
            }
          }
        }
        steps.push({ step: stepCounter++, line: lineNum, scope: { __log: [], ...scope }, issues: [] });
        try { lineHandle.dispose(); } catch (e) {}
      });

      vm.setProp(vm.global, '__snapshot', snapshotHandle);

      // Instrument code: append __snapshot(line) after every non-empty source line
      const lines = String(code).split('\n');
      const instrumented = lines.map((ln, idx) => {
        if (!ln.trim()) return ln;
        return `${ln}\n__snapshot(${idx + 1});`;
      }).join('\n');

      const result = vm.evalCode(instrumented);
      if (result.error) {
        const error = vm.dump(result.error);
        result.error.dispose();
        // dispose handles then vm
        try { consoleLogHandle.dispose(); } catch (e) {}
        try { consoleHandle.dispose(); } catch (e) {}
        vm.dispose();
        set({ vm: null });
        console.error('QuickJS Execution Error:', error);
        throw new Error(error.message || 'Execution failed');
      } else {
        result.value.dispose();
      }

  // dispose handles now (including snapshotHandle)
  try { snapshotHandle.dispose(); } catch (e) {}
  try { consoleLogHandle.dispose(); } catch (e) {}
  try { consoleHandle.dispose(); } catch (e) {}

      vm.dispose();
      set({ vm: null });

      return normalizeJsSteps(steps);
    }
  }
}));