// editorTheme.js
import { EditorView } from "@codemirror/view";
import { HighlightStyle, tags as t } from "@codemirror/highlight";

export const scribeDarkTheme = EditorView.theme({
  "&": {
    background: "transparent",
    color: "#e5e7eb",
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    height: "100%",
  },
  ".cm-content": {
    caretColor: "#3b82f6",
    paddingBottom: "10rem",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#3b82f6" },

  ".cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "rgba(37, 99, 235, 0.20)"
  },

  ".cm-activeLine": {
    backgroundColor: "rgba(148, 163, 184, 0.08)" 
  },

  ".cm-activeLineGutter": {
    backgroundColor: "transparent" 
  },

}, { dark: true });

export const scribeHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#60a5fa" },
  { tag: [t.string, t.special(t.string)], color: "#f472b6" },
  { tag: [t.number, t.bool], color: "#facc15" },
  { tag: t.comment, color: "#9ca3af", fontStyle: "italic" },
  { tag: t.variableName, color: "#f87171" },
  { tag: t.function(t.variableName), color: "#34d399" },
  { tag: t.definition(t.variableName), color: "#e879f9" },
  { tag: t.typeName, color: "#a5b4fc" },
  { tag: t.className, color: "#7dd3fc" },
]);