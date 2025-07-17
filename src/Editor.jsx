import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import throttle from './utils/throttle';

function Editor({ markdownText, setMarkdownText }) {
  const editor = useRef(null);
  const editorView = useRef(null);

  useEffect(() => {
    if (editor.current && !editorView.current) {
        
      const throttledUpdate = throttle((v) => {
        const text = v.state.doc.toString();
        if( markdownText!=text) setMarkdownText(text);
      }, 200);

      editorView.current = new EditorView({
        doc: markdownText,
        selection: {
          anchor: markdownText.length,
        },
        extensions: [
          basicSetup,
          markdown(),
          oneDark,
          keymap.of([indentWithTab]),
          EditorView.lineWrapping,
          EditorView.updateListener.of((v) => {
            if (v.docChanged) throttledUpdate(v);
          }),
        ],
        parent: editor.current, //this is where codemirror renders.
      });
    }
  }, []);

  useEffect(() => {
    if (editorView.current && markdownText!=editorView.current.state.doc.toString()) {
      editorView.current.dispatch({
        changes: {
          from: 0,
          to: editorView.current.state.doc.length,
          insert: markdownText,
        },
      });
      console.log("editor changed by markdown.")
    }
  }, [markdownText]);

  return <div className="editor" ref={editor}></div>;
}

export default Editor;
