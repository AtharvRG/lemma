import { createLanguageExecution } from '@/lib/languageExecutors';

test('debug python sample steps', () => {
  const code = `# Simple arithmetic and variable tracking
a = 1
b = 2
c = a + b
print(c)

# String operations
name = "World"
greeting = "Hello"
message = greeting + " " + name
print(message)

# More calculations
x = 10
y = 5
result = x * y + 3
print("Result:", result)
`;
  const steps = createLanguageExecution(code, 'python' as any);
  // Output a concise summary for each step
  steps.forEach((s, i) => {
    // @ts-ignore
    const logs = s.scope && Array.isArray(s.scope.__log) ? (s.scope.__log as any[]).map(v => (typeof v === 'string' ? v : JSON.stringify(v))) : [];
    // eslint-disable-next-line no-console
    console.log(`STEP ${i} line=${(s as any).line} logs=${JSON.stringify(logs)}`);
  });
  expect(steps.length).toBeGreaterThan(0);
});
