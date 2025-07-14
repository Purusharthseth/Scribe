import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import hljs from 'highlight.js';
import markdownItKatex from '@vscode/markdown-it-katex'
import { alertPlugin } from 'markdown-it-github-alert'

import 'highlight.js/styles/atom-one-dark.css';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
  xhtmlOut: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }

    return ''; // use external default escaping
  }
})
  .use(taskLists, { enabled: true })
  .use(markdownItKatex)
  .use(alertPlugin);


// Simple cache implementation
const cache = new Map();
const CACHE_SIZE = 200;

export function parseMarkdown(content) {
  if (!content) return '';
  
  // Check cache first
  if (cache.has(content)) {
    return cache.get(content);
  }

  // Parse the markdown
  const result = md.render(content);

  // Cache the result
  if (cache.size >= CACHE_SIZE) {
    cache.clear();
  }
  cache.set(content, result);

  return result;
}

// Export as default for flexible importing
export default parseMarkdown;