import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { Prec } from '@codemirror/state';
import markdownCustomKeys from '../../utils/markdown-commands.js';
import { scribeDarkTheme, scribeHighlightStyle } from './editorTheme.js';
import { syntaxHighlighting } from '@codemirror/language';
import { yCollab } from 'y-codemirror.next';

const ICmd = markdownCustomKeys.find(cmd => cmd.key === 'Mod-i');

function Editor({ ytext, awareness, readOnly = false, hidden = false }) {
  const editorEl = useRef(null);
  const viewRef = useRef(null);

  useEffect(() => {
    if (!editorEl.current || viewRef.current || !ytext) return;

    viewRef.current = new EditorView({
      doc: ytext.toString(),
      parent: editorEl.current,
      extensions: [
        basicSetup,
        markdown(),
        scribeDarkTheme,
        syntaxHighlighting(scribeHighlightStyle),

        EditorView.editable.of(!readOnly),

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

        yCollab(ytext, awareness, {
          // Use awareness field 'cursor' by default (what we set from CM focus)
          // You can pass user info & color mapping later if you want named cursors.
        }),
      ],
    });

    return () => {
      if (viewRef.current) {
        try { viewRef.current.destroy(); } catch {}
        viewRef.current = null;
      }
    };
  }, [ytext, readOnly, awareness]);


  return (
    <div
      ref={editorEl}
      className="editor h-[100%] overflow-auto"
    />
  );
}

export default Editor;