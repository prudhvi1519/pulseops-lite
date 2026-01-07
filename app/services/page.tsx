'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

interface Service {
    id: string;
    name: string;
    description: string | null;
    envCount: number;
    createdAt: string;
}

export default function ServicesPage() {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const loadServices = useCallback(async () => {
        try {
            const res = await fetch('/api/services');
            if (res.status === 401 || res.status === 403) {
                router.push('/login');
                return;
            }
            const data = await res.json();
            setServices(data.data?.services || []);
        } catch {
            setError('Failed to load services');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        loadServices();
    }, [loadServices]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);

        try {
            const res = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description: description || undefined }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error?.message || 'Failed to create service');
                return;
            }

            setName('');
            setDescription('');
            setShowForm(false);
            await loadServices();
        } catch {
            setError('An error occurred');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <AppShell>
                <PageHeader title="Services" />
                <Card padding="lg">
                    <SkeletonLoader height="3rem" />
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                        <SkeletonLoader height="3rem" />
                    </div>
                </Card>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <PageHeader title="Services" description="Manage your services and their environments">
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        padding: 'var(--spacing-xs) var(--spacing-md)',
                        backgroundColor: 'var(--color-text-primary)',
                        color: 'var(--color-surface)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-sm)',
                        cursor: 'pointer',
                    }}
                >
                    {showForm ? 'Cancel' : 'New Service'}
                </button>
            </PageHeader>

            {error && (
                <div
                    style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        backgroundColor: 'var(--color-error-bg)',
                        color: 'var(--color-error)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-sm)',
                        marginBottom: 'var(--spacing-md)',
                    }}
                >
                    {error}
                </div>
            )}

            {showForm && (
                <Card padding="lg" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <form onSubmit={handleCreate}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <div>
                                <label
                                    htmlFor="name"
                                    style={{
                                        display: 'block',
                                        fontSize: 'var(--text-sm)',
                                        fontWeight: 500,
                                        marginBottom: 'var(--spacing-xs)',
                                    }}
                                >
                                    Service Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--text-base)',
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="description"
                                    style={{
                                        display: 'block',
                                        fontSize: 'var(--text-sm)',
                                        fontWeight: 500,
                                        marginBottom: 'var(--spacing-xs)',
                                    }}
                                >
                                    Description (optional)
                                </label>
                                <input
                                    id="description"
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--text-base)',
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={creating}
                                style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    backgroundColor: 'var(--color-text-primary)',
                                    color: 'var(--color-surface)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: 'var(--text-base)',
                                    cursor: creating ? 'not-allowed' : 'pointer',
                                    opacity: creating ? 0.7 : 1,
                                }}
                            >
                                {creating ? 'Creating...' : 'Create Service'}
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            {services.length === 0 ? (
                <Card padding="lg">
                    <EmptyState
                        title="No services yet"
                        description="Create your first service to start monitoring."
                        icon={
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M12 8v8" />
                                <path d="M8 12h8" />
                            </svg>
                        }
                    />
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    {services.map((service) => (
                        <Card key={service.id} padding="md">
                            <Link
                                href={`/services/${service.id}`}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                }}
                            >
                                <div>
                                    <h3 style={{ fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>
                                        {service.name}
                                    </h3>
                                    {service.description && (
                                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 'var(--spacing-xs) 0 0' }}>
                                            {service.description}
                                        </p>
                                    )}
                                </div>
                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                                    {service.envCount} env{service.envCount !== 1 ? 's' : ''}
                                </span>
                            </Link>
                        </Card>
                    ))}
                </div>
            )}

            <div style={{ marginTop: 'var(--spacing-lg)' }}>
                <Link href="/dashboard" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-info)', textDecoration: 'underline' }}>
                    ← Back to Dashboard
                </Link>
            </div>
        </AppShell>
    );
}
