import { useState, useEffect, useRef, useCallback } from 'react';
import Preview from './Preview';
import { Pencil1Icon, Pencil2Icon, EyeOpenIcon, FileTextIcon, CheckIcon } from '@radix-ui/react-icons';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Heading, Text, Flex, Box, Spinner } from '@radix-ui/themes';
import Editor from './Editor';
import useVaultStore from '@/store/useVaultStore';
import UserList from '../UserList';

// NEW: Yjs client wiring
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';
import { useAuth } from '@clerk/clerk-react';
import { diff_match_patch } from 'diff-match-patch';

const WS_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

function EditorContainer({ vaultName, vaultId }) {
  const selectedFile = useVaultStore((s) => s.selectedFile);
  const isOwner = useVaultStore((s) => s.isOwner);
  const shareMode = useVaultStore((s) => s.shareMode);
  const { getToken } = useAuth();
  const [markdownText, setMarkdownText] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'preview' | 'editor'
  const [editorWidth, setEditorWidth] = useState(50);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dmp = new diff_match_patch();
  const ydocRef = useRef(null);
  const ytextRef = useRef(null);
  const providerRef = useRef(null);
  // const yObserverRef = useRef(null);
  const awarenessRef = useRef(null);

  const canEdit = isOwner || shareMode === 'edit';

  useEffect(() => {
    let cancelled = false;
    const cleanup = () => {
      console.log("🧹 [YJS] Starting cleanup...");
      
      const provider = providerRef.current;
      const ydoc = ydocRef.current;
      if (provider) try { provider.destroy(); } catch (e) {}
      if (ydoc) try { ydoc.destroy(); } catch (e) {}

      providerRef.current = null;
      ydocRef.current = null;
      ytextRef.current = null;
      awarenessRef.current = null;
      
      console.log("🧹 [YJS] Cleanup completed");
    };

    (async () => {
      cleanup();
      if (!selectedFile?.id || !vaultId) {
        setMarkdownText('');
        return;
      }

      const token = await getToken();
      const ydoc = new Y.Doc();
      const ytext = ydoc.getText('codemirror'); 
      const room = `file-${selectedFile.id}`;

      const provider = new SocketIOProvider(
        WS_URL,
        room,
        ydoc,
        { auth: { token, vaultId, fileId: selectedFile.id } }
      );

      provider.on('status', ({ status }) => {
        setIsSyncing(status !== 'connected');
      });
      ytext.observe( () => setMarkdownText(ytext.toString()) );

      if (cancelled) {
        // try { ytext.unobserve(applyFromCRDT); } catch {}
        try { provider.destroy(); } catch {}
        try { ydoc.destroy(); } catch {}
        return;
      }
      ydocRef.current = ydoc;
      ytextRef.current = ytext;
      providerRef.current = provider;
      // yObserverRef.current = applyFromCRDT;
      awarenessRef.current = provider.awareness; 

      setMarkdownText(ytext.toString());
    })();

    return () => { cancelled = true; cleanup(); };
  }, [selectedFile?.id, vaultId, getToken]);

const applyLocalChange = useCallback((nextText) => {
  if (!canEdit) return;
  const ytext = ytextRef.current;
  const ydoc = ydocRef.current;
  if (!ytext || !ydoc) return;

  const currentText = ytext.toString();
  if (currentText === nextText) return;

  const diffs = dmp.diff_main(currentText, nextText);
  dmp.diff_cleanupEfficiency(diffs);

  let index = 0;
  ydoc.transact(() => {
    for (const [type, text] of diffs) {
      if (type === 0) {
        index += text.length;
      } else if (type === -1) {
        ytext.delete(index, text.length);
      } else if (type === 1) {
        ytext.insert(index, text);
        index += text.length;
      }
    }
  });
}, [canEdit]);


  const handleMouseDown = () => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    setEditorWidth(Math.min(Math.max(newWidth, 25), 75));
  };
  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    if(!selectedFile || !canEdit) return;
    const cycleViewMode = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        setViewMode(prev => prev === 'split' ? 'preview' : prev === 'preview' ? 'editor' : 'split');
      }
    };
    window.addEventListener('keydown', cycleViewMode);
    return () => window.removeEventListener('keydown', cycleViewMode);
  }, [selectedFile, canEdit]);


  useEffect(() => {
    if (!canEdit) setViewMode('preview');
  }, [canEdit]);

  if (!selectedFile) {
    return (
      <Flex direction="column" align="center" justify="center" className="h-full">
        <Box className="text-center">
          <div className="bg-[var(--accent-3)] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FileTextIcon className="w-8 h-8 text-[var(--accent-11)]" />
          </div>
          <Heading size="6" mb="2" className="text-[var(--accent-11)]">Welcome to Scribe</Heading>
          <Text size="3" color="gray" mb="4">Select a file from the tree to start editing</Text>
          <Text size="2" color="gray">Type on left and view result on right</Text>
        </Box>
      </Flex>
    );
  }

  const hideEditor = (viewMode === 'preview') || !canEdit;
  const showSplit = (viewMode === 'split') && canEdit;
  const showEditorOnly = (viewMode === 'editor') && canEdit;

  return (
    <div ref={containerRef} className="relative flex flex-col w-full h-full bg-gradient-to-br from-[#18181b] to-[#23232a] select-none">
      {/* Top bar */}
      <div className="sticky top-0 z-10 w-full h-10 border-b border-[var(--gray-6)] bg-[var(--gray-3)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--gray-3)] flex items-center justify-between px-3 sm:px-4 shadow-[0_1px_0_0_rgba(255,255,255,0.02)]">
        <div className="flex items-center gap-2 min-w-0">
          <FileTextIcon className="w-4 h-4 text-[var(--accent-10)]" />
          <div className="flex items-center gap-2 min-w-0">
            <Text size="2" color="gray" className="truncate max-w-[22ch]">{vaultName || 'Vault'}</Text>
            <span className="text-[var(--gray-7)]">/</span>
            <Text size="2" weight="medium" className="truncate max-w-[32ch] text-[var(--gray-12)]" title={selectedFile?.name || 'Untitled'}>
              {selectedFile?.name || 'Untitled'}
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <UserList />
          {isSyncing ? (
            <div className="flex items-center gap-2 rounded-full px-2.5 py-1 border border-[var(--blue-6)] bg-[var(--blue-3)]/40 text-[var(--blue-11)]">
              <Spinner size="1" /><Text size="1">Syncing…</Text>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full px-2.5 py-1 border border-[var(--green-6)] bg-[var(--green-3)]/40 text-[var(--green-11)]">
              <CheckIcon className="w-4 h-4" /><Text size="1">Connected</Text>
            </div>
          )}

          {canEdit && (
            <Tooltip.Provider delayDuration={150}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => setViewMode(prev => prev === 'split' ? 'preview' : prev === 'preview' ? 'editor' : 'split')}
                    className="p-2 rounded-md hover:bg-[var(--gray-5)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-8)]"
                    aria-label={viewMode === 'split' ? 'Preview only' : viewMode === 'preview' ? 'Editor only' : 'Split view'}
                    title={viewMode === 'split' ? 'Preview only' : viewMode === 'preview' ? 'Editor only' : 'Split view'}
                  >
                    {viewMode === 'split' ? (
                      <EyeOpenIcon className="text-[var(--gray-11)] w-4 h-4" />
                    ) : viewMode === 'preview' ? (
                      <Pencil2Icon className="text-[var(--gray-11)] w-4 h-4" />
                    ) : (
                      <Pencil1Icon className="text-[var(--gray-11)] w-4 h-4" />
                    )}
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg select-none" side="bottom" sideOffset={5}>
                    {viewMode === 'split' ? 'Preview only' : viewMode === 'preview' ? 'Editor only' : 'Split view'}
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-w-0 min-h-0">
        {(showEditorOnly || showSplit) && (
          <div
            className="h-full flex flex-col min-w-0"
            style={{
              width: showEditorOnly ? '100%' : `${editorWidth}%`,
            }}
          >
            <div className="flex-1 min-h-0">
              <Editor
                ytext={ytextRef.current}
                awareness={awarenessRef.current}
                readOnly={!canEdit}
              />
            </div>
          </div>
        )}

        {/* Drag handle in split mode */}
        {showSplit && (
          <div
            className="w-0.5 flex items-center justify-center cursor-col-resize bg-gray-700 hover:bg-blue-800 transition-colors"
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Preview */}
        {(viewMode === 'split' || viewMode === 'preview' || !canEdit) && (
          <div
            className="h-full min-w-0 flex flex-col"
            style={{
              width:
                (!canEdit || viewMode === 'preview') ? '100%' :
                viewMode === 'split' ? `${100 - editorWidth}%` : '0%'
            }}
          >
            <div className="flex-1 min-h-0">
              <Preview markdownText={markdownText} setMarkdownText={applyLocalChange} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EditorContainer;