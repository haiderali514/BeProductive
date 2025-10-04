
import React, { useMemo } from 'react';

export const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const htmlContent = useMemo(() => {
        const lines = text.split('\n');
        let inList = false;
        const processedLines = lines.map(line => {
            // Headings
            if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`;
            if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
            if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
            
            // Bold
            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            // List items
            if (line.startsWith('* ')) {
                let listItem = `<li>${line.substring(2)}</li>`;
                if (!inList) {
                    inList = true;
                    return `<ul>${listItem}`;
                }
                return listItem;
            }

            if (inList && !line.startsWith('* ')) {
                inList = false;
                return `</ul>${line ? `<p>${line}</p>` : ''}`;
            }

            return line ? `<p>${line}</p>` : '';
        });

        if (inList) {
            processedLines.push('</ul>');
        }

        return processedLines.join('');
    }, [text]);

    return (
        <div 
            className="prose prose-invert prose-sm max-w-none text-content-primary space-y-3 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};
