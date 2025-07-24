 const wrppdSelection = (pref, suff)=>{
    return ({state, dispatch}) => {
        const {from, to}=state.selection.main;
        const selectedText=state.sliceDoc(from, to);
        const rplcmnt= pref+selectedText+suff;
        dispatch(state.update({
            changes: {from, to, insert: rplcmnt},
            selection: {anchor: from + pref.length, head: to + suff.length}
        }));
        return true;
    };
 }

const addAtPrefix= (pref)=>{
    return ({state, dispatch})=>{
        const line = state.doc.lineAt(state.selection.main.from);
        dispatch(state.update({
            changes: {from: line.from, insert: pref},
        }));
        return true;
    }
}
const markdownCustomKeys = [
  // Bold: Ctrl/Cmd+B
  {
    key: "Mod-b",
    run: wrppdSelection("**", "**"),
  },
  // Italic: Ctrl/Cmd+I
  {
    key: "Mod-i",
    run: wrppdSelection("*", "*"),
  },
  // Code: Ctrl/Cmd+`
  {
    key: "Mod-`",
    run: wrppdSelection("`", "`"),
  },
  // Link: Ctrl/Cmd+K
  {
    key: "Mod-k",
    run: wrppdSelection("[", "](url)"),
  },

  // Bullet List: Ctrl/Cmd+L
  {
    key: "Mod-l",
    run: addAtPrefix("- "),
  },
  // Numbered List: Ctrl/Cmd+Shift+L
  {
    key: "Mod-Shift-l",
    run: addAtPrefix("1. "),
  },
  // Blockquote: Ctrl/Cmd+>
  {
    key: "Mod-.", // Using . as it's often on the same key as >
    run: addAtPrefix("> "),
  },
];

export default markdownCustomKeys;