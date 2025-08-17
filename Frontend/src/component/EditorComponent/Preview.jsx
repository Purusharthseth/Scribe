import parseMarkdown from '@/lib/markdown';
import React, { useEffect } from 'react';

function Preview({ markdownText, setMarkdownText }) {
  useEffect(() => {
    const previewContainer = document.querySelector('.preview');
    const checkboxes = previewContainer.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach((checkbox, index) => {
      checkbox.dataset.index = index;
    });

    const handleCheckboxChange = (e) => {
      if (e.target.matches('input[type="checkbox"]')) {
        const checkboxIndex = parseInt(e.target.dataset.index);
        const lines = markdownText.split('\n');
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
      }
    };

    previewContainer.addEventListener('change', handleCheckboxChange);
    return () => previewContainer.removeEventListener('change', handleCheckboxChange);
  }, [markdownText]);

  return (
    <div
      className="preview markdown-body h-full w-full overflow-auto pb-40 p-10"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(markdownText) }}
    />
  );
}

export default React.memo(Preview);
