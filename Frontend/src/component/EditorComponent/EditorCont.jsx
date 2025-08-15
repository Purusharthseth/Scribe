import { useState, useEffect, useRef, useCallback } from 'react';
import Preview from './Preview';
import { Pencil1Icon, EyeOpenIcon, FileTextIcon } from '@radix-ui/react-icons';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Heading, Text, Flex, Box } from '@radix-ui/themes';
import Editor from './Editor';
import useVaultStore from '@/store/useVaultStore';
import useAxios from '@/utils/useAxios';
import debounce from '@/utils/debounce';
import toast from 'react-hot-toast';

function EditorContainer() {
  const selectedFile = useVaultStore((s) => s.selectedFile);
  const axios = useAxios();
  const [markdownText, setMarkdownText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editorWidth, setEditorWidth] = useState(50);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  
  const debouncedSave = useCallback(
    debounce(async (fileId, content) => {
      if (!fileId) return;
      try {
        setIsSaving(true);
        await axios.put(`/api/files/${fileId}`, { newContent: content });
        toast.success("File saved successfully.");
      } catch (error) {
        toast.error("Error updating file.");
      } finally {
        setIsSaving(false);
      }
    }, 5000),
    [axios]
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'e' && selectedFile) {
        e.preventDefault();
        setEditorWidth(prev => prev === 0 ? 50 : 0);
      }
    };
    window.addEventListener('keydown', editorOnOff);
    return () => window.removeEventListener('keydown', editorOnOff);
  }, [selectedFile]);

  useEffect(() => {
    if (!selectedFile) return;
    const fetchFileContent = async () => {
      if (selectedFile?.id) {
        try {
          const response = await axios.get(`/api/files/${selectedFile.id}`);
          setMarkdownText(response.data.data.content || "");
          setIsSaving(false);
        } catch (error) {
          console.error("Error fetching file:", error);
          setMarkdownText("");
          setIsSaving(false);
        }
      } else {
        setMarkdownText("");
        setIsSaving(false);
      }
    };
    fetchFileContent();
  }, [selectedFile?.id, axios]);

  useEffect(() => {
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
      <div className="absolute top-2 right-2 z-10">
        <Tooltip.Provider delayDuration={150}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={() => setEditorWidth(editorWidth === 0 ? 50 : 0)}
                className="p-2 rounded-md hover:bg-gray-700 transition-colors cursor-pointer"
              >
                {editorWidth === 0 ? (
                  <Pencil1Icon className="text-gray-300 w-5 h-5" />
                ) : (
                  <EyeOpenIcon className="text-gray-300 w-5 h-5" />
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
      </div>

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