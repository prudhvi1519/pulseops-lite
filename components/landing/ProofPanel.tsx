'use client';

import { useState } from 'react';

const CURL_EXAMPLE = `curl -X POST https://pulseops-lite.vercel.app/api/v1/logs/ingest \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "logs": [
      {
        "timestamp": "2026-01-11T22:00:00Z",
        "level": "error",
        "message": "Database connection failed",
        "meta": { "host": "db-prod-01" }
      }
    ]
  }'`;

const CHECKLIST = [
    'Sign up at /signup',
    'Create a service at /services',
    'Copy the API key (shown once!)',
    'POST logs using the cURL below',
    'View logs at /logs',
    'Create an incident at /incidents',
    'Resolve the incident',
    'Check the event timeline',
];

export function ProofPanel() {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(CURL_EXAMPLE);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section
            id="demo"
            style={{
                padding: 'var(--spacing-2xl) var(--spacing-lg)',
                backgroundColor: 'var(--color-surface)',
            }}
        >
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
                    <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
                        Try It Yourself
                    </h2>
                    <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)' }}>
                        Follow the checklist. No fake data—this hits the real API.
                    </p>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: 'var(--spacing-xl)',
                    }}
                >
                    {/* Checklist */}
                    <div>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
                            E2E Checklist
                        </h3>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {CHECKLIST.map((item, i) => (
                                <li
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-sm)',
                                        fontSize: 'var(--text-sm)',
                                        color: 'var(--color-text-secondary)',
                                    }}
                                >
                                    <span
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '4px',
                                            border: '1px solid var(--color-border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 'var(--text-xs)',
                                            color: 'var(--color-text-muted)',
                                        }}
                                    >
                                        {i + 1}
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* cURL Example */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Example cURL</h3>
                            <button
                                onClick={handleCopy}
                                style={{
                                    fontSize: 'var(--text-xs)',
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    backgroundColor: copied ? '#22c55e' : 'var(--color-background)',
                                    color: copied ? '#fff' : 'var(--color-text-secondary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    transition: 'all 150ms',
                                }}
                            >
                                {copied ? '✓ Copied!' : 'Copy'}
                            </button>
                        </div>
                        <pre
                            style={{
                                backgroundColor: '#1e1e2e',
                                color: '#cdd6f4',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--text-xs)',
                                fontFamily: 'var(--font-mono)',
                                overflowX: 'auto',
                                lineHeight: 1.5,
                            }}
                        >
                            <code>{CURL_EXAMPLE}</code>
                        </pre>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-sm)' }}>
                            Replace YOUR_API_KEY with the key from step 3.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
