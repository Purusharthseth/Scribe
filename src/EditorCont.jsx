import { useState, useEffect, useRef } from 'react';
import Editor from './Editor';
import Preview from './Preview';
import { Pencil1Icon, EyeOpenIcon } from '@radix-ui/react-icons';
import * as Tooltip from '@radix-ui/react-tooltip';

function EditorContainer() {
  const [markdownText, setMarkdownText] = useState(`# Welcome to Scribe

Write your text in left, and the readable doc will appear in right side!

The text is parsed in Markdown if you don't know how to write it click on help on top right!`);

  const [editorWidth, setEditorWidth] = useState(50);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect(); 
    //provides info about size and position of the container
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100; 
    //e.clientX gives the x coordinate of the mouse pointer.
    const constrainedWidth = Math.min(Math.max(newWidth, 25), 75);
    setEditorWidth(constrainedWidth);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => { //MOD+E for toggling editor mode on/off
    const editorOnOff = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        setEditorWidth(prev => prev === 0 ? 50 : 0);
      }
    };

    window.addEventListener('keydown', editorOnOff);
    return () => window.removeEventListener('keydown', editorOnOff);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="flex h-screen w-screen bg-[#1e1e1e] select-none"
    >
      {editorWidth > 0 && (
        <div 
          className="h-full overflow-hidden bg-[#1e1e1e] flex flex-col"
          style={{ width: `${editorWidth}%` }}
        >
          <div className="flex-1 flex flex-col h-full">
            <Editor markdownText={markdownText} setMarkdownText={setMarkdownText} />
          </div>
        </div>
      )}
      {editorWidth > 0 && editorWidth < 100 && (
        <div
          className="w-2 flex items-center justify-center cursor-col-resize bg-gray-700 hover:bg-blue-800 transition-colors"
          onMouseDown={handleMouseDown}
        >
        </div>
      )}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={() => setEditorWidth(editorWidth === 0 ? 50 : 0)}
            className="absolute top-4 right-10 p-2 rounded-md hover:bg-gray-700 transition-colors cursor-pointer"
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
            side="bottom"  // Changed from "left" to "bottom"
            sideOffset={5}
          >
            {editorWidth === 0 ? "Show editor" : "Hide editor"}
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>

      <div 
        className={`h-full overflow-auto ${editorWidth === 0 ? 'px-44 pt-7' : 'px-8 pt-5'} bg-gradient-to-br from-[#18181b] to-[#23232a]`}
        style={{ width: editorWidth === 0 ? '100%' : `${100 - editorWidth}%` }}
      >
        <Preview markdownText={markdownText} setMarkdownText={setMarkdownText} />
      </div>
    </div>
  );
}

export default EditorContainer;