const { getQuickJS } = require('quickjs-emscripten');

async function runOnce(code) {
  const QuickJS = await getQuickJS();
  const vm = QuickJS.newContext();
  const result = vm.evalCode(code);
  if (result.error) {
    const err = vm.dump(result.error);
    result.error.dispose();
    vm.dispose();
    throw new Error(err.message || String(err));
  }
  result.value.dispose();
  vm.dispose();
}

async function bench(iterations = 20) {
  const code = `
  let sum = 0;
  for (let i = 0; i < 10000; i++) {
    sum += i;
  }
  console.log(sum);
  `;
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = Date.now();
    await runOnce(code);
    times.push(Date.now() - t0);
    console.log(`iter ${i + 1}: ${times[times.length - 1]}ms`);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`avg: ${avg}ms`);
}

bench().catch(err => { console.error(err); process.exit(1); });
