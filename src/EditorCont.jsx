// EditorContainer.jsx
import { useState } from 'react';
import Editor from './Editor';
import Preview from './Preview';

function EditorContainer() {
  const [markdownText, setMarkdownText] = useState(`# Welcome to Scribe

Write your text in left, and the readable doc will appear in right side!

The text is parsed in Markdown if you don't know how to write it click on help on top right!`);

  return (
    <div className="container">
      <Editor markdownText={markdownText} setMarkdownText={setMarkdownText} />
      <Preview markdownText={markdownText} setMarkdownText={setMarkdownText} />
    </div>
  );
}

export default EditorContainer;
