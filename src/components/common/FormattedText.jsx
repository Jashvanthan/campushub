import React from 'react';

/**
 * Converts legacy markdown (e.g. **hello**, ** jas**) inside HTML or text into clean HTML tags.
 * Strips all asterisk symbols and converts them to <strong> or <em> tags.
 */
export function cleanMarkdownToHtml(raw) {
  if (!raw) return '';
  let str = String(raw);

  // 1. Triple asterisks (bold + italic): ***text***
  str = str.replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>');

  // 2. Double asterisks (bold): **text** or ** text ** or __text__
  str = str.replace(/\*{2}\s*(.+?)\s*\*{2}/g, '<strong>$1</strong>');
  str = str.replace(/_{2}\s*(.+?)\s*_{2}/g, '<strong>$1</strong>');

  // 3. Single asterisks (italic): *text* (excluding list items)
  str = str.replace(/(?<!\*|\b)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
  str = str.replace(/(?<!_|\b)_([^_\n]+?)_(?!_)/g, '<em>$1</em>');

  // 4. Inline code: `text`
  str = str.replace(/`([^`]+)`/g, '<code class="post-inline-code">$1</code>');

  // 5. Links: [text](url)
  str = str.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|[^\s)]+)\)/g, (match, linkText, url) => {
    const safeUrl = url.startsWith('http') || url.startsWith('mailto') ? url : `https://${url}`;
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="post-inline-link">${linkText}</a>`;
  });

  return str;
}

/**
 * Parses markdown inline formatting (**bold**, *italic*, `code`, [link](url))
 * and block structures into clean React elements with no raw symbols.
 */
export function parseInlineMarkdown(text) {
  if (!text) return text;

  // Regex tokens:
  // 1. Link: [text](url)
  // 2. Bold: **text** or __text__
  // 3. Inline Code: `text`
  // 4. Italic: *text* or _text_
  const tokenRegex = /(\[[^\]]+\]\([^\s)]+\)|\*{2,3}[^*]+\*{2,3}|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Link: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|tel:[^\s)]+|[^\s)]+)\)$/);
    if (linkMatch) {
      const [, linkText, url] = linkMatch;
      const safeUrl = url.startsWith('http') || url.startsWith('mailto') ? url : `https://${url}`;
      return (
        <a
          key={index}
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="post-inline-link"
          onClick={(e) => e.stopPropagation()}
        >
          {linkText}
        </a>
      );
    }

    // Bold + Italic: ***text***
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return (
        <strong key={index} className="post-bold-text">
          <em className="post-italic-text">{part.slice(3, -3).trim()}</em>
        </strong>
      );
    }

    // Bold: **text** or __text__ (strip all asterisks and render clean bold)
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return (
        <strong key={index} className="post-bold-text">
          {part.slice(2, -2).trim()}
        </strong>
      );
    }

    // Inline code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={index} className="post-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Italic: *text* or _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <em key={index} className="post-italic-text">
          {part.slice(1, -1).trim()}
        </em>
      );
    }

    return part;
  });
}

export default function FormattedText({ text, className = '', fallback = '' }) {
  const content = text || fallback;
  if (!content) return null;

  // If content contains HTML tags or markdown asterisks, render it cleanly with safe HTML
  const hasHtmlOrMarkdown = /<\/?(b|strong|em|i|u|span|p|br|div|ul|ol|li|blockquote|code|a|h[1-6])\b/i.test(content) || /\*{2,3}/.test(content);
  
  if (hasHtmlOrMarkdown) {
    const cleanedHtml = cleanMarkdownToHtml(content);
    return (
      <span
        className={`formatted-post-content ${className}`}
        dangerouslySetInnerHTML={{ __html: cleanedHtml }}
      />
    );
  }

  // Otherwise parse standard text and clean any markdown
  const lines = content.split('\n');

  return (
    <span className={`formatted-post-content ${className}`}>
      {lines.map((line, lineIdx) => {
        // Quote block: > text
        if (line.startsWith('> ')) {
          return (
            <span key={lineIdx} className="post-quote-block">
              {parseInlineMarkdown(line.slice(2))}
              {lineIdx < lines.length - 1 && <br />}
            </span>
          );
        }

        // Bullet item: • text or - text or * text
        if (line.startsWith('• ') || line.startsWith('- ') || (line.startsWith('* ') && !line.endsWith('*'))) {
          const bulletContent = line.replace(/^(•|-|\*)\s+/, '');
          return (
            <span key={lineIdx} className="post-list-item">
              <span className="post-bullet-dot">•</span> {parseInlineMarkdown(bulletContent)}
              {lineIdx < lines.length - 1 && <br />}
            </span>
          );
        }

        // Numbered list item: 1. text
        const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const [, num, itemContent] = numMatch;
          return (
            <span key={lineIdx} className="post-list-item">
              <span className="post-num-prefix">{num}.</span> {parseInlineMarkdown(itemContent)}
              {lineIdx < lines.length - 1 && <br />}
            </span>
          );
        }

        return (
          <React.Fragment key={lineIdx}>
            {parseInlineMarkdown(line)}
            {lineIdx < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </span>
  );
}

