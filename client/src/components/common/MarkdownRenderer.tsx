import React, { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content?: string | null;
  className?: string;
  fallback?: React.ReactNode;
}

// Sanitize URL to avoid javascript: and data: XSS injections
function sanitizeUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (/^(https?:\/\/|mailto:|\/)/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Render inline tokens: bold, italic, inline code, links, strikethrough
 */
function renderInlineTokens(text: string): React.ReactNode[] {
  // Regex to match:
  // 1. Links: [label](url)
  // 2. Bold: **text** or __text__
  // 3. Italic: *text* or _text_
  // 4. Strikethrough: ~~text~~
  // 5. Inline code: `code`
  const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|~~([^~]+)~~|\*([^*]+)\*|_([^_]+)_)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      nodes.push(text.substring(lastIndex, matchIndex));
    }

    // Link: [label](url)
    if (match[2] && match[3]) {
      const label = match[2];
      const url = sanitizeUrl(match[3]);
      if (url) {
        const isExternal = url.startsWith('http://') || url.startsWith('https://');
        nodes.push(
          <a
            key={`link-${matchIndex}`}
            href={url}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center gap-0.5 text-[#FE4E1A] font-bold underline decoration-[#FE4E1A]/50 hover:decoration-[#FE4E1A] hover:text-[#e03d0d] transition-colors break-words"
          >
            <span>{label}</span>
            {isExternal && <ExternalLink className="w-3 h-3 inline-block ml-0.5 flex-shrink-0 opacity-80" />}
          </a>
        );
      } else {
        nodes.push(label);
      }
    }
    // Bold: **text** or __text__
    else if (match[4] || match[5]) {
      const boldText = match[4] || match[5];
      nodes.push(
        <strong key={`bold-${matchIndex}`} className="font-headline font-black text-[#121316]">
          {boldText}
        </strong>
      );
    }
    // Inline code: `code`
    else if (match[6]) {
      const codeText = match[6];
      nodes.push(
        <code
          key={`code-${matchIndex}`}
          className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 text-[#0F534A] border border-[#0F534A]/30 rounded-none shadow-[1px_1px_0px_#0F534A]"
        >
          {codeText}
        </code>
      );
    }
    // Strikethrough: ~~text~~
    else if (match[7]) {
      const strikeText = match[7];
      nodes.push(
        <del key={`strike-${matchIndex}`} className="line-through text-gray-500">
          {strikeText}
        </del>
      );
    }
    // Italic: *text* or _text_
    else if (match[8] || match[9]) {
      const italicText = match[8] || match[9];
      nodes.push(
        <em key={`italic-${matchIndex}`} className="italic text-gray-800">
          {italicText}
        </em>
      );
    } else {
      nodes.push(match[0]);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.substring(lastIndex));
  }

  return nodes;
}

export default function MarkdownRenderer({
  content,
  className = '',
  fallback,
}: MarkdownRendererProps) {
  const renderedElements = useMemo(() => {
    if (!content || !content.trim()) {
      return null;
    }

    const lines = content.split(/\r?\n/);
    const elements: React.ReactNode[] = [];

    let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    const flushList = (keyPrefix: string) => {
      if (!currentList) return;
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={`${keyPrefix}-ul`} className="space-y-2 pl-1 my-2">
            {currentList.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-800 font-medium">
                <span className="text-[#FE4E1A] font-bold text-xs mt-0.5 select-none flex-shrink-0">✦</span>
                <span className="leading-relaxed flex-1">{renderInlineTokens(item)}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`${keyPrefix}-ol`} className="space-y-2 pl-1 my-2">
            {currentList.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-800 font-medium">
                <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-headline font-black bg-[#0F534A] text-white flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed flex-1">{renderInlineTokens(item)}</span>
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    };

    const flushCodeBlock = (keyPrefix: string) => {
      if (!inCodeBlock) return;
      elements.push(
        <div
          key={`${keyPrefix}-codeblock`}
          className="my-3 p-3 sm:p-4 bg-[#121316] text-[#9EFC5F] font-mono text-xs sm:text-sm border-2 border-[#0F534A] shadow-[3px_3px_0px_#0F534A] overflow-x-auto"
        >
          <pre className="whitespace-pre-wrap">{codeBlockContent.join('\n')}</pre>
        </div>
      );
      inCodeBlock = false;
      codeBlockContent = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check for code block fences ```
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock(`cb-${i}`);
        } else {
          flushList(`flush-${i}`);
          inCodeBlock = true;
          codeBlockContent = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Check for horizontal rules: ---, ***, ___
      if (/^(\*\*\*|---|___)$/.test(trimmed)) {
        flushList(`hr-${i}`);
        elements.push(
          <hr key={`hr-${i}`} className="my-5 border-t-2 border-dashed border-[#0F534A]/25" />
        );
        continue;
      }

      // Unordered list item: - item or * item
      const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
      if (ulMatch) {
        if (!currentList || currentList.type !== 'ul') {
          flushList(`ul-flush-${i}`);
          currentList = { type: 'ul', items: [] };
        }
        currentList.items.push(ulMatch[2]);
        continue;
      }

      // Ordered list item: 1. item
      const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
      if (olMatch) {
        if (!currentList || currentList.type !== 'ol') {
          flushList(`ol-flush-${i}`);
          currentList = { type: 'ol', items: [] };
        }
        currentList.items.push(olMatch[2]);
        continue;
      }

      // If we got here, line is not a list item: flush any open list
      flushList(`line-${i}`);

      // Blank line
      if (!trimmed) {
        continue;
      }

      // Headings
      if (trimmed.startsWith('#### ')) {
        elements.push(
          <h4
            key={`h4-${i}`}
            className="text-sm sm:text-base font-headline font-black uppercase text-[#4717AE] tracking-tight pt-2 mt-2"
          >
            {renderInlineTokens(trimmed.replace(/^####\s+/, ''))}
          </h4>
        );
        continue;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3
            key={`h3-${i}`}
            className="text-base sm:text-lg font-headline font-black uppercase text-[#0F534A] tracking-tight pt-3 mt-1"
          >
            {renderInlineTokens(trimmed.replace(/^###\s+/, ''))}
          </h3>
        );
        continue;
      }

      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2
            key={`h2-${i}`}
            className="text-lg sm:text-xl font-headline font-black uppercase text-[#FE4E1A] tracking-tight pt-4 mt-2"
          >
            {renderInlineTokens(trimmed.replace(/^##\s+/, ''))}
          </h2>
        );
        continue;
      }

      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1
            key={`h1-${i}`}
            className="text-xl sm:text-2xl font-headline font-black uppercase text-[#121316] tracking-tight pt-5 mt-2"
          >
            {renderInlineTokens(trimmed.replace(/^#\s+/, ''))}
          </h1>
        );
        continue;
      }

      // Blockquotes: > quote text
      if (trimmed.startsWith('>')) {
        const quoteText = trimmed.replace(/^>\s*/, '');
        elements.push(
          <blockquote
            key={`quote-${i}`}
            className="my-3 pl-4 pr-3 py-2 bg-[#FCFBF7] border-l-4 border-[#0F534A] text-gray-700 italic text-xs sm:text-sm shadow-[1px_1px_0px_#0F534A]"
          >
            {renderInlineTokens(quoteText)}
          </blockquote>
        );
        continue;
      }

      // Embedded image: ![alt](url)
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        const altText = imgMatch[1];
        const rawImgUrl = imgMatch[2];
        const safeImgUrl = sanitizeUrl(rawImgUrl);

        if (safeImgUrl) {
          elements.push(
            <figure key={`img-${i}`} className="my-4 bg-white border-2 border-[#0F534A] shadow-[4px_4px_0px_#0F534A] overflow-hidden">
              <img
                src={safeImgUrl}
                alt={altText || 'Campaign Story Media'}
                loading="lazy"
                className="w-full max-h-[440px] object-cover block"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              {altText && (
                <figcaption className="px-3 py-1.5 bg-[#FCFBF7] border-t border-[#0F534A]/20 text-[11px] font-medium text-gray-600 text-center">
                  {altText}
                </figcaption>
              )}
            </figure>
          );
          continue;
        }
      }

      // Regular paragraph
      elements.push(
        <p key={`p-${i}`} className="text-[#121316] font-medium text-xs sm:text-sm leading-relaxed my-2">
          {renderInlineTokens(line)}
        </p>
      );
    }

    // Flush any remaining unclosed list or code block
    flushList('final');
    flushCodeBlock('final');

    return elements;
  }, [content]);

  if (!renderedElements || renderedElements.length === 0) {
    if (fallback) return <>{fallback}</>;
    return null;
  }

  return <div className={`markdown-body space-y-2 ${className}`}>{renderedElements}</div>;
}
