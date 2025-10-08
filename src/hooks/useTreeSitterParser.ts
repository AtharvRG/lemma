import { create } from 'zustand';
import Parser from 'web-tree-sitter';
import { Language } from '@/types';

type ParserState = {
  isInitialized: boolean;
  parser: Parser | null;
  languageParsers: Map<Language, Parser.Language>;
  init: () => Promise<void>;
  parseCode: (code: string, lang: Language) => Promise<Parser.Tree | null>;
};

let initPromise: Promise<void> | null = null;

export const useTreeSitterParser = create<ParserState>((set, get) => ({
  isInitialized: false,
  parser: null,
  languageParsers: new Map(),

  init: async () => {
    if (typeof window === 'undefined') return;
    
    if (!initPromise) {
      initPromise = (async () => {
        await Parser.init({
          locateFile: (scriptName: string) => `/${scriptName}`,
        });
        const parser = new Parser();
        set({ parser, isInitialized: true });
      })();
    }
    await initPromise;
  },

  parseCode: async (code, lang) => {
    await get().init();
    
    const { parser, languageParsers } = get();
    if (!parser) {
      throw new Error("Parser failed to initialize.");
    }
    
    let languageWasm = languageParsers.get(lang);
    if (!languageWasm) {
      try {
        const wasmPath = `/wasm/tree-sitter-${lang}.wasm`;
        languageWasm = await Parser.Language.load(wasmPath);
        set(state => ({
            languageParsers: new Map(state.languageParsers).set(lang, languageWasm as Parser.Language)
        }));
      } catch (e) {
        console.error(`Failed to load parser for ${lang}`, e);
        throw new Error(`Could not load grammar for ${lang}.`);
      }
    }
    
    if (!languageWasm) {
        throw new Error(`Grammar for ${lang} is not available.`);
    }
    
    parser.setLanguage(languageWasm);
    return parser.parse(code);
  },
}));