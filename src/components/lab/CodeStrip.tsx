'use client';
import Editor, { loader, OnChange, useMonaco } from '@monaco-editor/react';
import { useProjectStore } from '@/hooks/useProjectStore';
import { LANGUAGES, Language } from '@/types';
import { Keyboard, ChevronLeft, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useState, useRef } from 'react';

interface CodeStripProps {
  togglePanel: () => void;
}

export function CodeStrip({ togglePanel }: CodeStripProps) {
  const { code, language, setCode, setLanguage, executionSteps, currentStepIndex, parseError, setExecutionSteps } = useProjectStore();
  const setParseError = useProjectStore((s: any) => (s as any).parseError === undefined ? null : (s as any).parseError);
  const [isVimMode, setIsVimMode] = useState(false);
  
  const editorRef = useRef<any>(null);
  const statusBarRef = useRef<HTMLDivElement>(null);
  const vimModeRef = useRef<any>(null);
  const monaco = useMonaco();
  const decorationsRef = useRef<any[]>([]);
  const parseErrorDecorationRef = useRef<any[]>([]);

  const handleEditorChange: OnChange = useCallback((value) => {
    setCode(value || '');
    // Clear parse error as user edits
    try {
      // Use the store setter directly
      (useProjectStore as any).setState({ parseError: null });
    } catch (e) {
      // ignore
    }
  }, [setCode]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const toggleVimMode = () => {
    setIsVimMode(prev => !prev);
  };

  useEffect(() => {
    if (editorRef.current && statusBarRef.current) {
      if (isVimMode && !vimModeRef.current) {
        // Dynamically import monaco-vim to avoid SSR issues
        import('monaco-vim').then(({ initVimMode }) => {
          if (editorRef.current && statusBarRef.current) {
            vimModeRef.current = initVimMode(editorRef.current, statusBarRef.current);
          }
        });
      } else if (!isVimMode && vimModeRef.current) {
        vimModeRef.current.dispose();
        vimModeRef.current = null;
      }
    }
  }, [isVimMode]);

  // Highlight current execution line
  useEffect(() => {
    if (editorRef.current && monaco && executionSteps.length > 0) {
      const currentStep = executionSteps[currentStepIndex];
      const editor = editorRef.current;
      
      // Clear previous decorations
      if (decorationsRef.current.length > 0) {
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      }
      
      let lineNumber = 1;
      if (!currentStep) {
        lineNumber = 1;
      } else if ((currentStep as any).line !== undefined) {
        lineNumber = (currentStep as any).line || 1;
      } else {
        // If current step doesn't have a line, search backward for a step with a line (useful for instrumented JS snapshots)
        let foundLine: number | undefined;
        for (let i = currentStepIndex; i >= 0; i--) {
          const s: any = executionSteps[i];
          if (!s) continue;
          if (s.line !== undefined) { foundLine = s.line; break; }
          if (s.executionContext?.lineNumber) { foundLine = s.executionContext.lineNumber; break; }
          if (s.node?.startPosition?.row !== undefined) { foundLine = s.node.startPosition.row + 1; break; }
        }
        lineNumber = foundLine || 1;
      }
      
      // Add highlighting decoration
      const newDecorations = [
        {
          range: new monaco.Range(lineNumber, 1, lineNumber, 1),
          options: {
            isWholeLine: true,
            className: 'current-execution-line',
            glyphMarginClassName: 'current-execution-glyph',
            minimap: {
              color: '#00ffff',
              position: 1
            }
          }
        }
      ];
      
  decorationsRef.current = editor.deltaDecorations([], newDecorations);
      
  // Scroll to the highlighted line
  if (lineNumber && lineNumber > 0) editor.revealLineInCenter(lineNumber);
    }
  }, [monaco, executionSteps, currentStepIndex, language]);

  // Highlight parse errors (if any)
  useEffect(() => {
    if (!editorRef.current || !monaco) return;
    const editor = editorRef.current;

    // Clear previous parse error decoration
    if (parseErrorDecorationRef.current.length > 0) {
      parseErrorDecorationRef.current = editor.deltaDecorations(parseErrorDecorationRef.current, []);
    }

    if (parseError && parseError.line && parseError.line > 0) {
      const errLine = parseError.line;
      const startCol = parseError.startColumn || 1;
      const endCol = parseError.endColumn || startCol + 1;

      // If we have column info, highlight exact token range; otherwise fallback to whole-line
      const range = new monaco.Range(errLine, startCol, errLine, endCol);
      const isWhole = !(parseError.startColumn && parseError.endColumn);

      const errDecorations = [
        {
          range,
          options: {
            isWholeLine: isWhole,
            className: isWhole ? 'parse-error-line' : 'parse-error-token',
            glyphMarginClassName: 'parse-error-glyph',
            minimap: { color: '#ff6b6b', position: 1 },
            hoverMessage: { value: parseError.message }
          }
        }
      ];

      parseErrorDecorationRef.current = editor.deltaDecorations([], errDecorations);

      // Scroll to the error line to draw attention
      if (errLine && errLine > 0) editor.revealLineInCenter(errLine);
    }

    // Also set Monaco markers so the error appears in the Problems pane
    try {
      const model = editor.getModel();
      if (model) {
        if (parseError && parseError.line) {
          const startCol = parseError.startColumn || 1;
          const endCol = parseError.endColumn || startCol + 1;
          const marker = {
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: parseError.line,
            startColumn: startCol,
            endLineNumber: parseError.line,
            endColumn: endCol,
            message: parseError.message,
            source: 'parser'
          } as any;
          monaco.editor.setModelMarkers(model, 'lemma-parser', [marker]);
        } else {
          monaco.editor.setModelMarkers(model, 'lemma-parser', []);
        }
      }
    } catch (e) {
      // ignore marker failures
    }
  }, [monaco, parseError]);

  // Add CSS for highlighting
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes execHighlight {
          0% { background-color: rgba(6, 182, 212, 0); transform: translateY(0); }
          40% { background-color: rgba(6, 182, 212, 0.2); transform: translateY(-2px); }
          100% { background-color: rgba(6, 182, 212, 0.15); transform: translateY(0); }
        }
        .current-execution-line {
          background-color: rgba(6, 182, 212, 0.15) !important;
          border-left: 5px solid #22d3ee !important;
          margin-left: -3px !important;
          animation: execHighlight 420ms cubic-bezier(.2,.9,.3,1) both;
          transition: background-color 200ms ease;
        }
        .current-execution-glyph {
          background-color: #22d3ee !important;
          width: 4px !important;
        }
        .parse-error-line {
          background-color: rgba(220, 38, 38, 0.12) !important;
          border-left: 5px solid #ef4444 !important;
          margin-left: -3px !important;
        }
        .parse-error-glyph {
          background-color: #ef4444 !important;
          width: 6px !important;
        }
        .parse-error-token {
          background-color: rgba(239, 68, 68, 0.22) !important;
          border-radius: 3px !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  // Theme loading
  useEffect(() => {
    if (monaco) {
      // Load and define the theme
      loader.init().then(monacoInstance => {
        import('monaco-themes/themes/Tomorrow-Night-Eighties.json')
          .then(data => {
            // Define the theme with a consistent name
            monacoInstance.editor.defineTheme('tomorrow-night-eighties', data as any);
            // Set the editor to use our newly defined theme
            monacoInstance.editor.setTheme('tomorrow-night-eighties');
          });
      });
    }
  }, [monaco]);

  return (
    <div className="h-full flex flex-col bg-gray-900"> {/* Match theme background */}
      <div className="flex-shrink-0 h-10 flex items-center justify-between pl-3 pr-1 border-b border-gray-800">
        <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                title="Language"
                className="appearance-none pr-7 pl-2 py-1 bg-gray-800 border border-gray-700 text-white text-sm font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button 
                onClick={toggleVimMode} 
                className={`p-1.5 rounded-md text-xs flex items-center gap-1.5 ${isVimMode ? 'bg-gray-700 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
                title="Toggle Vim Mode"
            >
                <Keyboard className="w-4 h-4"/>
                VIM
            </button>
        </div>
        <button onClick={togglePanel} className="p-1 rounded hover:bg-gray-800" title="Collapse Panel">
            <ChevronLeft className="w-4 h-4 text-gray-400"/>
        </button>
      </div>
      <div className="flex-grow w-full h-full relative">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="tomorrow-night-eighties" // Apply the theme here
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            contextmenu: false,
            padding: { top: 10 }
          }}
          loading={<div className="text-white p-4">Loading Editor...</div>}
        />
      </div>
      <div ref={statusBarRef} className="flex-shrink-0 h-6 px-2 text-sm text-gray-400 bg-gray-800 flex items-center justify-between">
        <div>
          {parseError ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-300">{parseError.message}</span>
              <button
                onClick={() => {
                  if (!editorRef.current) return;
                  const line = parseError?.line || 1;
                  editorRef.current.revealLineInCenter(line);
                  // Reset the run state so the corrected code can be executed fresh
                  try { (useProjectStore as any).getState().reset(); } catch (e) { /* ignore */ }
                }}
                className="text-xs bg-red-600 hover:bg-red-500 px-2 py-0.5 rounded text-white"
              >
                Go to error
              </button>
            </div>
          ) : null}
        </div>
        <div />
      </div>
    </div>
  );
}