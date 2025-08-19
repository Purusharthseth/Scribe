import parseMarkdown from '@/lib/markdown';
import React, { useEffect, useRef } from 'react';

function Preview({ markdownText, setMarkdownText }) {
  const containerRef = useRef(null); //so hum ispe laga ske apna event listener
  //without this we might grab old preview.
  const textRef = useRef(markdownText);
  useEffect(() => {
    textRef.current = markdownText;
  }, [markdownText]);

  const handleCheckboxChange = (e) => {
    if (!e.target.matches('input[type="checkbox"]')) return;

    const checkboxIndex = parseInt(e.target.dataset.index, 10);
    const lines = (textRef.current || '').split('\n');
    let checkboxCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^(\s*[-*] \[)( |x)(\])\s/);
      if (match) {
        if (checkboxCount === checkboxIndex) {
          lines[i] = lines[i].replace(/\[.\]/, e.target.checked ? '[x]' : '[ ]');
          setMarkdownText(lines.join('\n'));
          break;
        }
        checkboxCount++;
      }
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('change', handleCheckboxChange);
    return () => el.removeEventListener('change', handleCheckboxChange);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const checkboxes = el.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox, index) => {
      checkbox.dataset.index = String(index);
    });
  }, [markdownText]);

  return (
    <div
      ref={containerRef}                              
      className="preview markdown-body h-full w-full overflow-auto pb-40 p-10"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(markdownText) }}
    />
  );
}

export default React.memo(Preview);