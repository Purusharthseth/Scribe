import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { Prec } from '@codemirror/state';
import markdownCustomKeys from '../../utils/markdown-commands.js';
import { scribeDarkTheme, scribeHighlightStyle } from './editorTheme.js';
import { syntaxHighlighting } from "@codemirror/language";

const ICmd = markdownCustomKeys.find(cmd => cmd.key === "Mod-i");

function Editor({ markdownText, setMarkdownText }) {
  const editor = useRef(null);
  const editorView = useRef(null);

  useEffect(() => {
    if (editor.current && !editorView.current) {
      editorView.current = new EditorView({
        doc: markdownText,
        selection: {
          anchor: markdownText.length,
        },
        extensions: [
          basicSetup,
          markdown(),
          scribeDarkTheme,
          syntaxHighlighting(scribeHighlightStyle),
          Prec.highest(
            keymap.of([
              {
                key: "Mod-i",
                run: ICmd?.run || (() => false),
                preventDefault: true
              }
            ])
          ),
          keymap.of([indentWithTab, ...markdownCustomKeys]),
          EditorView.lineWrapping,
          EditorView.updateListener.of((v) => {
            if (v.docChanged) {
              const text = v.state.doc.toString();
              if (text !== markdownText) setMarkdownText(text);
              if (v.selectionSet) {
                v.view.dispatch({
                  effects: EditorView.scrollIntoView(v.state.selection.main.from, {
                    y: "center",
                  })
                });
              }
            }
          }),
        ],
        parent: editor.current,
      });
    }
  }, []);
  

  useEffect(() => {
    if (editorView.current) {
      const currentDoc = editorView.current.state.doc.toString();
      if (markdownText !== currentDoc) {
        editorView.current.dispatch({
          changes: {
            from: 0,
            to: currentDoc.length,
            insert: markdownText,
          },
        });
      }
    }
  }, [markdownText]);

  return <div className="editor h-screen flex-1" ref={editor}></div>;
}

export default Editor;
