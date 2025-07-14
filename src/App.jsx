import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import parseMarkdown from './lib/markdown';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import './App.css';
function App() {
  const editor = useRef(null);
  const editorView = useRef(null);
  const [markdownText, setMarkdownText] = useState(`# Welcome to Scribe

Write your text in left, and the readable doc will appear in right side!

The text is parsed in Markdown if you don't know how to write it click on help on top right!`); //the text that appears in markdown 

  // Initialize CodeMirror
  useEffect(() => {
    if (editor.current && !editorView.current) {
      editorView.current = new EditorView({
        doc: markdownText,
        selection:{
          anchor: markdownText.length
        },
        extensions: [
          basicSetup,
          markdown(),
          oneDark,
          keymap.of([indentWithTab]),
          EditorView.lineWrapping, 
          EditorView.updateListener.of((v) => { //listens for changes in codemirror doc
            if (v.docChanged) {
              const text = v.state.doc.toString();
              setMarkdownText(text);
            }
          }), //synchronizes react with codemirror.
        ],
        parent: editor.current,
      });
    }
  }, []);

  // Sync preview checkbox → markdown editor
  useEffect(() => {
    const previewContainer = document.querySelector('.preview');

    // Add data-index attributes to checkboxes
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
              const updatedLine = lines[i].replace(
                /\[.\]/, 
                e.target.checked ? '[x]' : '[ ]'
              );
              lines[i] = updatedLine;
              
              const updatedText = lines.join('\n');
              setMarkdownText(updatedText);
              
              if (editorView.current) {
                editorView.current.dispatch({
                  changes: {
                    from: 0,
                    to: editorView.current.state.doc.length,
                    insert: updatedText
                  }
                });
              }
              break;
            }
            checkboxCount++;
          }
        }
      }
    };
    previewContainer.addEventListener('change', handleCheckboxChange);

    // Cleanup function
    return () => {
      previewContainer.removeEventListener('change', handleCheckboxChange);
    };
  }, [markdownText]);

  // Fix for sleep/resume sync issues
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && editorView.current) {
        editorView.current.dispatch({
          changes: {
            from: 0,
            to: editorView.current.state.doc.length,
            insert: markdownText
          }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
