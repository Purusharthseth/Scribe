import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import parseMarkdown from './lib/markdown';
import './App.css';

function App() {
  const editor = useRef(null);
  const editorView = useRef(null);
  const [markdownText, setMarkdownText] = useState(`# Hello World

This is **bold** and *italic*

- [ ] Task one
- [x] Task done
`);

  // Initialize CodeMirror
  useEffect(() => {
    if (editor.current && !editorView.current) {
      editorView.current = new EditorView({
        doc: markdownText,
        extensions: [
          basicSetup,
          markdown(),
          oneDark,
          EditorView.updateListener.of((v) => {
            if (v.docChanged) {
              const text = v.state.doc.toString();
              setMarkdownText(text);
            }
          }),
        ],
        parent: editor.current,
      });
    }
  }, []);

  // Sync preview checkbox → markdown editor
  useEffect(() => {
    const checkboxes = document.querySelectorAll('.preview input[type="checkbox"]');

    checkboxes.forEach((checkbox, index) => {
      checkbox.disabled = false;

      const handler = () => {
        const lines = markdownText.split('\n');
        let count = 0;

        for (let i = 0; i < lines.length; i++) {
          const match = lines[i].match(/^(\s*[-*] \[)( |x)(\])\s/);
          if (match) {
            if (count === index) {
              const newLine = lines[i].replace(/\[.\]/, checkbox.checked ? '[x]' : '[ ]');
              lines[i] = newLine;

              const updatedText = lines.join('\n');
              setMarkdownText(updatedText);

              editorView.current.dispatch({
                changes: {
                  from: 0,
                  to: editorView.current.state.doc.length,
                  insert: updatedText,
                },
              });
              break;
            }
            count++;
          }
        }
      };

      checkbox.addEventListener('change', handler);

      // Clean up listener on re-render
      checkbox.dataset.handlerAttached = 'true';
    });

    return () => {
      checkboxes.forEach((checkbox) => {
        if (checkbox.dataset.handlerAttached) {
          const newCheckbox = checkbox.cloneNode(true);
          checkbox.parentNode.replaceChild(newCheckbox, checkbox);
        }
      });
    };
  }, [markdownText]);

  return (
    <div className="container">
      <div className="editor" ref={editor}></div>
      <div
        className="preview markdown-body"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(markdownText) }}
      />
    </div>
  );
}

export default App;
