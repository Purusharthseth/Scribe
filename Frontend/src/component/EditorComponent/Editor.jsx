import { useEffect, useRef, useMemo } from 'react';
import { EditorView } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { Prec } from '@codemirror/state';
import { bracketMatching, indentOnInput, foldGutter, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import {  } from '@codemirror/search';
import { yCollab } from 'y-codemirror.next';
import * as Y from 'yjs';
import markdownCustomKeys from '../../utils/markdown-commands.js';
import { scribeDarkTheme } from './editorTheme.js';
import { useUser } from '@clerk/clerk-react';
import { languages } from '@codemirror/language-data';
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark';

const ICmd = markdownCustomKeys.find((cmd) => cmd.key === 'Mod-i');

// Custom setup without history
const customSetup = [
  lineNumbers(),
  foldGutter(),
  indentOnInput(),
  bracketMatching(),
  highlightActiveLine(),
];

function randomColor() {
  const palette = [
  { color: '#30bced', light: '#30bced33' },
  { color: '#6eeb83', light: '#6eeb8333' },
  { color: '#ffbc42', light: '#ffbc4233' },
  { color: '#ecd444', light: '#ecd44433' },
  { color: '#ee6352', light: '#ee635233' },
  { color: '#9ac2c9', light: '#9ac2c933' },
  { color: '#8acb88', light: '#8acb8833' },
  { color: '#1be7ff', light: '#1be7ff33' }];

  return palette[Math.floor(Math.random() * palette.length)];
}

function Editor({ ytext, awareness }) {
  const editorEl = useRef(null);
  const viewRef = useRef(null);
  const { user } = useUser();
  const undoRef = useRef(null);
  

  const localUser = useMemo(() => {
    const username = user?.username || `Anonymous${Math.random()*100}`;
    const clr= randomColor();
    return { name: username, color: clr.color, colorLight: clr.light };
  }, [user]);

  useEffect(() => {
    if (!awareness) return; 
    awareness.setLocalStateField('user', localUser);
  }, [awareness, localUser]);
  

  useEffect(() => {
    if (!editorEl.current || viewRef.current || !ytext) return;
    if (!undoRef.current) {
      undoRef.current = new Y.UndoManager(ytext, {
        captureTimeout: 200,
        trackedOrigins: new Set([user.username])
      });
    }
      const yUndoKeymap = keymap.of([
    {
      key: "Mod-z",
      preventDefault: true,
      run: () => {
        if (undoRef.current) { undoRef.current.undo(); return true; }
        return false;
      },
    },
    {
      key: "Mod-Shift-z",
      preventDefault: true,
      run: () => {
        if (undoRef.current) { undoRef.current.redo(); return true; }
        return false;
      },
    },
    {
      key: "Mod-y", // Windows redo
      preventDefault: true,
      run: () => {
        if (undoRef.current) { undoRef.current.redo(); return true; }
        return false;
      },
    },
  ]);


    viewRef.current = new EditorView({
      doc: ytext.toString(),
      parent: editorEl.current,
      extensions: [
        markdown({ codeLanguages: languages }),
        syntaxHighlighting(oneDarkHighlightStyle),
        customSetup, 
        scribeDarkTheme,
        Prec.highest(yUndoKeymap),
        Prec.highest(
          keymap.of([
            {
              key: 'Mod-i',
              run: ICmd?.run || (() => false),
              preventDefault: true,
            },
          ])
        ),
        keymap.of([indentWithTab, ...markdownCustomKeys]),
        EditorView.lineWrapping,
        yCollab(ytext, awareness, { undoManager: undoRef.current }),
      ],
    });

    return () => {
      if (viewRef.current) {
        try { viewRef.current.destroy();} catch {}
        viewRef.current = null;
      }
      if (undoRef.current) {
        try { undoRef.current.destroy(); } catch {}
        undoRef.current = null;
      }
    };
  }, [ytext, awareness]);

  return <div ref={editorEl} className="editor h-[100%] overflow-auto"  />;
}

export default Editor;