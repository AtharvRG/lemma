import { createLanguageExecution } from '../lib/languageExecutors';

let parser: any = null;
let ParserLib: any = null;
const languageCache = new Map<string, any>();
let initPromise: Promise<void> | null = null;

async function ensureParserInitialized() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    // Dynamically import web-tree-sitter inside the worker so bundlers handle it correctly
    ParserLib = await import('web-tree-sitter');
    // Initialize runtime (locateFile tells the loader where to find the wasm). We use absolute root paths
    await ParserLib.init({ locateFile: (scriptName: string) => `/${scriptName}` });
    parser = new ParserLib();
  })();
  return initPromise;
}

self.addEventListener('message', (evt: MessageEvent) => {
  const { code, language } = evt.data || {};
  (async () => {
    try {
      // Ensure parser is available in the worker
      try {
        await ensureParserInitialized();
      } catch (e) {
        // If we cannot initialize parser in worker, fall back to simulation
        // but continue execution path below.
      }

      // If parser is initialized, try to load the language and parse to detect syntax errors
      if (parser && ParserLib) {
        try {
          let lang = languageCache.get(language);
          if (!lang) {
            const wasmPath = `/wasm/tree-sitter-${language}.wasm`;
            lang = await ParserLib.Language.load(wasmPath);
            languageCache.set(language, lang);
          }
          parser.setLanguage(lang);
          const tree = parser.parse(code || '');
          // If there are errors, try to find ERROR nodes or use hasError
          let hasErr = false;
          try { hasErr = typeof tree.rootNode.hasError === 'function' ? tree.rootNode.hasError() : false; } catch (e) { hasErr = false; }
          if (!hasErr) {
            // BFS search for ERROR node
            const queue = [tree.rootNode];
            while (queue.length) {
              const n = queue.shift();
              if (!n) continue;
              if (n.type === 'ERROR') { hasErr = true; break; }
              const children = (n.namedChildren && n.namedChildren.length) ? n.namedChildren : (n.children || []);
              if (children && children.length) {
                for (const c of children) queue.push(c);
              }
            }
          }
          if (hasErr) {
            // Post back an error so main thread shows parse error and doesn't run simulation
            // @ts-ignore - worker global
            (self as any).postMessage({ error: 'Syntax error detected in worker. Please fix the code before running.' });
            return;
          }
        } catch (e) {
          // If any language load/parse error occurs, fall back to simulation
        }
      }

      // If we reach here, either parser checked fine or was unavailable: run simulation
      const steps = createLanguageExecution(code, language as any);
      // Post back the steps
      // @ts-ignore - worker global
      (self as any).postMessage({ steps });
    } catch (err) {
      (self as any).postMessage({ error: String(err) });
    }
  })();
});
