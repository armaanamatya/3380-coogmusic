import React from 'react';

interface TextHighlightProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

export const TextHighlight: React.FC<TextHighlightProps> = ({
  text,
  query,
  className = '',
  highlightClassName = 'bg-yellow-200 font-medium'
}) => {
  if (!query || !text) {
    return <span className={className}>{text}</span>;
  }

  // Create a case-insensitive regex to find matches
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  
  // Split text by matches while preserving the matched parts
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part matches the query (case-insensitive)
        const isMatch = regex.test(part);
        regex.lastIndex = 0; // Reset regex for next test
        
        return isMatch ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
};