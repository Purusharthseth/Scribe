import { useState, useEffect, useRef, useCallback } from 'react';
import Preview from './Preview';
import { Pencil1Icon, EyeOpenIcon, FileTextIcon, CheckIcon } from '@radix-ui/react-icons';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Heading, Text, Flex, Box, Spinner } from '@radix-ui/themes';
import Editor from './Editor';
import useVaultStore from '@/store/useVaultStore';
import useAxios from '@/utils/useAxios';
import debounce from '@/utils/debounce';
import toast from 'react-hot-toast';

function EditorContainer({ vaultName }) {
  const selectedFile = useVaultStore((s) => s.selectedFile);
  const isOwner = useVaultStore((s) => s.isOwner);
  const shareMode = useVaultStore((s) => s.shareMode);
  const shareToken = useVaultStore((s) => s.shareToken);
  const axios = useAxios();
  const [markdownText, setMarkdownText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editorWidth, setEditorWidth] = useState(50);
  const [fileChanged, setFileChanged] = useState(false);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  const canEdit = isOwner || shareMode === 'edit';
  const shareTokenParam = (!isOwner && shareToken) ? `?shareToken=${shareToken}` : '';

  
  const debouncedSave = useCallback(
    debounce(async (fileId, content) => {
      if (!fileId || !canEdit) return;
      try {
        setIsSaving(true);
        await axios.put(`/api/files/${fileId}${shareTokenParam}`, { newContent: content });
      } catch (error) {
        toast.error("Error updating file.");
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    [axios, canEdit, shareTokenParam]
  );

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
    const constrainedWidth = Math.min(Math.max(newWidth, 25), 75);
    setEditorWidth(constrainedWidth);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    const editorOnOff = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'e' && selectedFile && canEdit) {
        e.preventDefault();
        setEditorWidth(prev => prev === 0 ? 50 : 0);
      }
    };
    window.addEventListener('keydown', editorOnOff);
    return () => window.removeEventListener('keydown', editorOnOff);
  }, [selectedFile, canEdit]);

  useEffect(() => {
    if (!selectedFile) return;
    const fetchFileContent = async () => {
      if (selectedFile?.id) {
        try {
          const response = await axios.get(`/api/files/${selectedFile.id}${shareTokenParam}`);
          setMarkdownText(response.data.data.content || "");
        } catch (error) {
          console.error("Error fetching file:", error);
          setMarkdownText("");
        }
      } else {
        setMarkdownText("");
      }
    };
    fetchFileContent();
    setFileChanged(true);
  }, [selectedFile?.id, shareTokenParam]);

  useEffect(() => {
    if (!canEdit) {
      setEditorWidth(0);
    }
  }, [canEdit]);

  useEffect(() => {
    if(fileChanged){
      setFileChanged(false);
      return;
    }
    if (selectedFile?.id) {
      setIsSaving(true);
      debouncedSave(selectedFile.id, markdownText);
    }
  }, [markdownText]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isSaving) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSaving]);

  if (!selectedFile) {
    return (
      <Flex direction="column" align="center" justify="center" className="h-full">
        <Box className="text-center">
          <div className="bg-[var(--accent-3)] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FileTextIcon className="w-8 h-8 text-[var(--accent-11)]" />
          </div>
          <Heading size="6" mb="2" className="text-[var(--accent-11)]">
            Welcome to Scribe
          </Heading>
          <Text size="3" color="gray" mb="4">
            Select a file from the tree to start editing
          </Text>
          
          <Text size="2" color="gray">
            Type on left and view result on right
          </Text>
        </Box>
      </Flex>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full h-full bg-gradient-to-br from-[#18181b] to-[#23232a] select-none"
    >

      {/* Navigation Bar */}
      <div className="sticky top-0 z-10 w-full h-10 border-b border-[var(--gray-6)] bg-[var(--gray-3)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--gray-3)] flex items-center justify-between px-3 sm:px-4 shadow-[0_1px_0_0_rgba(255,255,255,0.02)]">
        <div className="flex items-center gap-2 min-w-0">
          <FileTextIcon className="w-4 h-4 text-[var(--accent-10)]" />
          <div className="flex items-center gap-2 min-w-0">
            <Text size="2" color="gray" className="truncate max-w-[22ch]">
              {vaultName || 'Vault'}
            </Text>
            <span className="text-[var(--gray-7)]">/</span>
            <Text
              size="2"
              weight="medium"
              className="truncate max-w-[32ch] text-[var(--gray-12)]"
              title={selectedFile?.name || 'Untitled'}
            >
              {selectedFile?.name || 'Untitled'}
            </Text>
          </div>
        </div>

        {/* Right: status + view toggle */}
        <div className="flex items-center gap-3">
          {!canEdit ? (
            <div className="flex items-center gap-2 rounded-full px-2.5 py-1 border border-[var(--gray-6)] bg-[var(--gray-3)]/40 text-[var(--gray-11)]">
              <EyeOpenIcon className="w-4 h-4" />
              <Text size="1">Only View</Text>
            </div>
          ) : isSaving ? (
            <div className="flex items-center gap-2 rounded-full px-2.5 py-1 border border-[var(--blue-6)] bg-[var(--blue-3)]/40 text-[var(--blue-11)]">
              <Spinner size="1" />
              <Text size="1">Saving…</Text>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full px-2.5 py-1 border border-[var(--green-6)] bg-[var(--green-3)]/40 text-[var(--green-11)]">
              <CheckIcon className="w-4 h-4" />
              <Text size="1">Saved</Text>
            </div>
          )}

          {/* View toggle - only show when user can edit */}
          {canEdit && (
            <Tooltip.Provider delayDuration={150}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => setEditorWidth(editorWidth === 0 ? 50 : 0)}
                    className="p-2 rounded-md hover:bg-[var(--gray-5)] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-8)]"
                    aria-label={editorWidth === 0 ? 'Show editor' : 'Hide editor'}
                    title={editorWidth === 0 ? 'Show editor' : 'Hide editor'}
                  >
                    {editorWidth === 0 ? (
                      <Pencil1Icon className="text-[var(--gray-11)] w-4 h-4" />
                    ) : (
                      <EyeOpenIcon className="text-[var(--gray-11)] w-4 h-4" />
                    )}
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg select-none"
                    side="bottom"
                    sideOffset={5}
                  >
                    {editorWidth === 0 ? 'Show editor' : 'Hide editor'}
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          )}
        </div>
      </div>
      {/* Editor and Preview area */}


      {/* Editor and Preview area */}
      <div className="flex flex-1 min-w-0 min-h-0">
        {/* Editor */}
        {editorWidth > 0 && (
          <div
            className="h-full flex flex-col min-w-0"
            style={{ width: `${editorWidth}%` }}
          >
            <div className="flex-1 min-h-0">
              <Editor markdownText={markdownText} setMarkdownText={setMarkdownText} />
            </div>
          </div>
        )}
        {editorWidth > 0 && editorWidth < 100 && (
          <div
            className="w-0.5 flex items-center justify-center cursor-col-resize bg-gray-700 hover:bg-blue-800 transition-colors"
            onMouseDown={handleMouseDown}
          />
        )}
        <div
          className="h-full min-w-0 flex flex-col"
          style={{ width: editorWidth === 0 ? '100%' : `${100 - editorWidth}%` }}
        >
          <div className="flex-1 min-h-0">
            <Preview markdownText={markdownText} setMarkdownText={setMarkdownText} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorContainer;