import { getQuickJS } from 'quickjs-emscripten';

self.addEventListener('message', async (evt: MessageEvent) => {
  const { code, id } = evt.data || {};
  try {
    const QuickJS = await getQuickJS();
    const vm = QuickJS.newContext();

    const steps: any[] = [];
    let stepCounter = 0;

    // native snapshot function to capture a scope snapshot for a given line
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
      args.forEach(a => a.dispose());
    });

  const consoleHandle = vm.newObject();
  vm.setProp(consoleHandle, 'log', consoleLogHandle);
  vm.setProp(vm.global, 'console', consoleHandle);
  // expose native snapshot to global so instrumented code can call it
  vm.setProp(vm.global, '__snapshot', snapshotHandle);
  // Keep handles alive until after execution to ensure callbacks remain valid

    // Simple instrumentation: append __snapshot(line) after each non-empty source line
    const lines = String(code).split('\n');
    const instrumented = lines.map((ln, idx) => {
      if (!ln.trim()) return ln; // preserve blank lines
      return `${ln}\n__snapshot(${idx + 1});`;
    }).join('\n');

    const result = vm.evalCode(instrumented);
    if (result.error) {
      const err = vm.dump(result.error);
      result.error.dispose();
      // dispose handles then vm
      try { consoleLogHandle.dispose(); } catch (e) {}
      try { consoleHandle.dispose(); } catch (e) {}
      vm.dispose();
      (self as any).postMessage({ id, error: err });
      return;
    } else {
      result.value.dispose();
    }

  // safe to dispose handles now (including snapshotHandle)
  try { snapshotHandle.dispose(); } catch (e) {}
  try { consoleLogHandle.dispose(); } catch (e) {}
  try { consoleHandle.dispose(); } catch (e) {}

    vm.dispose();
    (self as any).postMessage({ id, steps });
  } catch (err) {
    (self as any).postMessage({ id, error: String(err) });
  }
});
