import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import throttle from 'lodash.throttle';
import { parseMarkdown } from '@/lib/markdown';

const LINE_HEIGHT = 30;
const VISIBLE_LINES = 20;
const EDITOR_HEIGHT = LINE_HEIGHT * VISIBLE_LINES;

const InsanelyOptimizedEditor = () => {
  const [markdown, setMarkdown] = useState(`# Hello
This is **markdown**
- List item 1
- List item 2

More text...`);

  const [parsedLines, setParsedLines] = useState([]);
  const textareaRef = useRef(null);
  const listRef = useRef(null);

  const lines = useMemo(() => markdown.split('\n'), [markdown]);

  const throttledParse = useCallback(
    throttle((text) => {
      const newLines = text.split('\n').map(line =>
        line === '' ? '<span>&nbsp;</span>' : parseMarkdown(line)
      );
      setParsedLines(newLines);
    }, 150),
    []
  );

  useEffect(() => {
    throttledParse(markdown);
    return () => throttledParse.cancel?.();
  }, [markdown, throttledParse]);

  const handleChange = (e) => {
    setMarkdown(e.target.value);
  };

  const handleScroll = (e) => {
    if (listRef.current) {
      listRef.current.scrollToItem(Math.floor(e.target.scrollTop / LINE_HEIGHT), 'start');
    }
  };

  const syncScroll = useCallback(() => {
    if (textareaRef.current && listRef.current) {
      listRef.current.scrollToItem(Math.floor(textareaRef.current.scrollTop / LINE_HEIGHT), 'start');
    }
  }, []);

  const Row = ({ index, style }) => (
    <div style={{ ...style, lineHeight: `${LINE_HEIGHT}px` }}>
      <div
        className="whitespace-pre-wrap p-2 select-none font-mono text-base"
        dangerouslySetInnerHTML={{ __html: parsedLines[index] || '<span>&nbsp;</span>' }}
      />
    </div>
  );

  return (
    <div className="relative w-full max-w-[800px] mx-auto border border-gray-300 rounded-lg overflow-hidden font-mono text-base leading-[30px]"
         style={{ height: EDITOR_HEIGHT }}>
      {/* Preview layer */}
      <List
        height={EDITOR_HEIGHT}
        itemCount={lines.length}
        itemSize={LINE_HEIGHT}
        width="100%"
        ref={listRef}
        className="absolute top-0 left-0 pointer-events-none text-gray-700 bg-white overflow-hidden"
      >
        {Row}
      </List>

      {/* Transparent textarea input on top */}
      <textarea
        ref={textareaRef}
        value={markdown}
        onChange={handleChange}
        onScroll={handleScroll}
        spellCheck={false}
        className="absolute top-0 left-0 w-full h-full bg-transparent text-transparent caret-black border-none resize-none outline-none p-2 overflow-auto whitespace-pre-wrap break-words m-0 font-mono text-base leading-[30px]"
      />
    </div>
  );
};

export default InsanelyOptimizedEditor;