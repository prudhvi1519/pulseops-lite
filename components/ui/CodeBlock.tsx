import React from 'react';

interface CodeBlockProps {
    code: string;
    language?: string;
}

export function CodeBlock({ code }: CodeBlockProps) {
    return (
        <pre
            style={{
                backgroundColor: 'var(--color-surface-muted)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                border: '1px solid var(--color-border)',
                margin: 0
            }}
        >
            <code>{code}</code>
        </pre>
    );
}
