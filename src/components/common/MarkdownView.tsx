import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  const htmlContent = useMemo(() => {
    if (!content) return '';
    try {
      marked.setOptions({
        gfm: true,
        breaks: true,
      });
      return marked.parse(content) as string;
    } catch (err) {
      console.error('Markdown parse error:', err);
      return content;
    }
  }, [content]);

  return (
    <div
      className={`prose-cafe max-w-none text-sm leading-relaxed text-cafe-text dark:text-stone-200 ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
