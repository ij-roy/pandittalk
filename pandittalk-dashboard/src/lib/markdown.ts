import { marked } from 'marked';
import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});

marked.setOptions({ gfm: true, breaks: true });

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html || '').trim();
}

export function markdownToHtml(markdown: string): string {
  return String(marked.parse(markdown || '', { async: false }));
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
