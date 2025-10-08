 'use client';

import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';
import { CodeStrip } from './CodeStrip';
import { TimelineStrip } from './TimelineStrip';
import { VariablesPanel } from './VariablesPanel';
import { ExecutionSummary } from './ExecutionSummary';
import { Toolbar } from './Toolbar';
import { useEffect, useRef, useState } from 'react';
import { useTreeSitterParser } from '@/hooks/useTreeSitterParser';
import { useProjectStore, hydrateRunHistoryFromStorage, startRunHistoryPersistence } from '@/hooks/useProjectStore';
import { decodeAndDecompress } from '@/lib/sharing';
import { supabase } from '@/lib/supabase';
import { ShareDialog } from './ShareDialog';
import toast, { Toaster } from 'react-hot-toast';
import { useLayoutStore } from '@/hooks/useLayoutStore';
import { hydrateLayoutFromStorage } from '@/hooks/useLayoutStore';

export function LabLayout() {
  const { init: initParser } = useTreeSitterParser();
  const { loadFromSharedState } = useProjectStore();
  
  const codePanelRef = useRef<ImperativePanelHandle>(null);
  const variablesPanelRef = useRef<ImperativePanelHandle>(null);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);
  const isTimelineFloating = useLayoutStore((s) => s.isTimelineFloating);
  const setTimelineFloating = useLayoutStore((s) => s.setTimelineFloating);
  const timelinePos = useLayoutStore((s) => s.timelinePos);
  const setTimelinePos = useLayoutStore((s) => s.setTimelinePos);

  useEffect(() => {
    initParser();

    // Hydrate layout state from localStorage on client only to avoid SSR/CSR mismatches
    hydrateLayoutFromStorage();

    // Hydrate run history and start persistence (client-only)
    hydrateRunHistoryFromStorage();
    const unsubRunHistory = startRunHistoryPersistence();

    // Ensure timeline and execution strips are visible by default on initial load
    setIsTimelineCollapsed(false);
    setTimelineFloating(false);

    const params = new URLSearchParams(window.location.search);
    const shortQuery = params.get('s');
    const hash = window.location.hash;

    // Helper: decode payload and load project, showing toasts
    const decodeAndLoad = async (encodedData: string) => {
      const loadingPromise = (async () => {
        const project = decodeAndDecompress(encodedData);
        if (!project) throw new Error('Invalid share link');
        loadFromSharedState(project);
        // remove fragment/query from URL for cleanliness
        window.history.replaceState(null, '', window.location.pathname);
      })();

      await toast.promise(loadingPromise, {
        loading: 'Loading shared project...',
        success: 'Project loaded successfully!',
        error: 'Could not load project from link.',
      });
    };

    // Helper: resolve short id to payload and load
    const resolveShortAndLoad = async (id: string) => {
      const p = (async () => {
        const { data, error } = await supabase
          .from('shared_projects')
          .select('payload')
          .eq('project_id', id)
          .limit(1)
          .single();

        if (error || !data || !data.payload) throw new Error('Short link not found or expired.');
        await decodeAndLoad(data.payload);
      })();

      await toast.promise(p, {
        loading: 'Resolving short link...',
        success: 'Short link resolved',
        error: 'Could not resolve short link',
      });
    };

    (async () => {
      try {
        if (shortQuery) {
          await resolveShortAndLoad(shortQuery);
          return;
        }

        if (hash.startsWith('#s:')) {
          const id = hash.substring(3);
          await resolveShortAndLoad(id);
          return;
        }

        if (hash.startsWith('#h:')) {
          const encodedData = hash.substring(3);
          await decodeAndLoad(encodedData);
          return;
        }
      } catch (e) {
        // errors already surfaced via toast.promise
      }
    })();
    return () => {
      try { unsubRunHistory && unsubRunHistory(); } catch (e) { }
    };
  }, [initParser, loadFromSharedState, setTimelineFloating]);

  const toggleCodePanel = () => {
    const panel = codePanelRef.current;
    if (panel) {
      panel.isCollapsed() ? panel.resize(25) : panel.collapse();
    }
  };

  const toggleVariablesPanel = () => {
    const panel = variablesPanelRef.current;
    if (panel) {
      panel.isCollapsed() ? panel.resize(25) : panel.collapse();
    }
  };
  
  const toggleTimelinePanel = () => {
    setIsTimelineCollapsed(prev => !prev);
  };

  const toggleTimelineFloating = () => {
    setTimelineFloating(!isTimelineFloating);
  };
  
  return (
    <>
      <div className="h-screen w-screen flex flex-col bg-gray-950 overflow-hidden">
        <Toolbar />
        <div className="flex-grow">
          <PanelGroup direction="horizontal">
            <Panel ref={codePanelRef} defaultSize={25} minSize={15} collapsible={true}>
              <CodeStrip togglePanel={toggleCodePanel} />
            </Panel>
            <PanelResizeHandle className="w-2 bg-gray-800 hover:bg-gray-600 transition-colors" />

            {/* Center column split vertically: ExecutionSummary top, TimelineStrip bottom */}
            <Panel>
              <PanelGroup direction="vertical">
                <Panel defaultSize={60} minSize={30}>
                  <div className="p-4 h-full">
                    <ExecutionSummary hideProgress />
                  </div>
                </Panel>
                <PanelResizeHandle className="h-2 bg-gray-800 hover:bg-gray-600 transition-colors" />
                <Panel defaultSize={40} minSize={20}>
                  <div className="p-4 h-full">
                    <TimelineStrip isCollapsed={false} togglePanel={toggleTimelinePanel} onFloatToggle={toggleTimelineFloating} />
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>

            <PanelResizeHandle className="w-2 bg-gray-800 hover:bg-gray-600 transition-colors" />
            <Panel ref={variablesPanelRef} defaultSize={25} minSize={15} collapsible={true}>
              <div className="h-full flex flex-col">
                <div className="flex-grow">
                  <VariablesPanel togglePanel={toggleVariablesPanel} />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>

      <ShareDialog />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#32303f',
            color: '#e5e7eb',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
    </>
  );
}