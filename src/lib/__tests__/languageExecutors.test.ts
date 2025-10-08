import { createLanguageExecution } from '@/lib/languageExecutors';

describe('createLanguageExecution parity', () => {
  test('python execution produces final output and log', () => {
    const code = `a = 1\nprint(a)`;
    const steps = createLanguageExecution(code, 'python' as any);
    expect(steps.length).toBeGreaterThan(0);
    const last = steps[steps.length - 1];
    expect(last.scope).toBeDefined();
    expect(Array.isArray(last.scope.__log)).toBe(true);
    expect(typeof last.scope.__finalOutput).toBe('string');
  });

  test('go execution produces final output and log', () => {
    const code = `package main\nimport \"fmt\"\nfunc main() { fmt.Println(2) }`;
    const steps = createLanguageExecution(code, 'go' as any);
    expect(steps.length).toBeGreaterThan(0);
    const last = steps[steps.length - 1];
    expect(last.scope).toBeDefined();
    expect(Array.isArray(last.scope.__log)).toBe(true);
    expect(typeof last.scope.__finalOutput).toBe('string');
  });

  test('rust execution produces final output and log', () => {
    const code = `fn main() { println!(\"hi\"); }`;
    const steps = createLanguageExecution(code, 'rust' as any);
    expect(steps.length).toBeGreaterThan(0);
    const last = steps[steps.length - 1];
    expect(last.scope).toBeDefined();
    expect(Array.isArray(last.scope.__log)).toBe(true);
    expect(typeof last.scope.__finalOutput).toBe('string');
  });

  test('cpp execution produces final output and log', () => {
    const code = `#include <iostream>\nint main() { std::cout << 3 << std::endl; return 0; }`;
    const steps = createLanguageExecution(code, 'cpp' as any);
    expect(steps.length).toBeGreaterThan(0);
    const last = steps[steps.length - 1];
    expect(last.scope).toBeDefined();
    expect(Array.isArray(last.scope.__log)).toBe(true);
    expect(typeof last.scope.__finalOutput).toBe('string');
  });
});
