'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error?.message || 'Login failed');
                return;
            }

            router.push('/dashboard');
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--color-background)',
                padding: 'var(--spacing-lg)',
            }}
        >
            <div style={{ width: '100%', maxWidth: '400px' }}>
                <PageHeader
                    title="Sign In"
                    description="Enter your credentials to access your account"
                />

                <Card padding="lg">
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {error && (
                                <div
                                    style={{
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        backgroundColor: 'var(--color-error-bg)',
                                        color: 'var(--color-error)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--text-sm)',
                                    }}
                                >
                                    {error}
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="email"
                                    style={{
                                        display: 'block',
                                        fontSize: 'var(--text-sm)',
                                        fontWeight: 500,
                                        color: 'var(--color-text-primary)',
                                        marginBottom: 'var(--spacing-xs)',
                                    }}
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--text-base)',
                                        backgroundColor: 'var(--color-surface)',
                                    }}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    style={{
                                        display: 'block',
                                        fontSize: 'var(--text-sm)',
                                        fontWeight: 500,
                                        color: 'var(--color-text-primary)',
                                        marginBottom: 'var(--spacing-xs)',
                                    }}
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--text-base)',
                                        backgroundColor: 'var(--color-surface)',
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    backgroundColor: 'var(--color-text-primary)',
                                    color: 'var(--color-surface)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: 'var(--text-base)',
                                    fontWeight: 500,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                }}
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </div>
                    </form>

                    <p
                        style={{
                            marginTop: 'var(--spacing-lg)',
                            textAlign: 'center',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--color-text-secondary)',
                        }}
                    >
                        Don&apos;t have an account?{' '}
                        <a
                            href="/signup"
                            style={{
                                color: 'var(--color-info)',
                                textDecoration: 'underline',
                            }}
                        >
                            Sign up
                        </a>
                    </p>
                </Card>
            </div>
        </div>
    );
}
