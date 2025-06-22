import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import taskLists from 'markdown-it-task-lists';
import hljs from 'highlight.js';
import markdownItKatex from '@vscode/markdown-it-katex'

import 'highlight.js/styles/atom-one-dark.css';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
      } catch (_) {}
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  },
})
  .use(markdownItKatex)
  .use(taskLists, { enabled: true })
  .use(markdownItKatex);


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