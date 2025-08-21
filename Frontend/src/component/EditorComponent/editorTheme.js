import { EditorView } from "@codemirror/view";

export const scribeDarkTheme = EditorView.theme({
  "&": { background: "transparent", color: "#e5e7eb", fontFamily: "Inter, sans-serif", fontSize: "14px", height: "100%" },
  ".cm-content": { caretColor: "#3b82f6", paddingBottom: "10rem" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#3b82f6" },
  ".cm-selectionBackground, .cm-content ::selection": { backgroundColor: "rgba(37,99,235,0.20)" },
  ".cm-activeLine": { backgroundColor: "rgba(148,163,184,0.08)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
}, { dark: true });

