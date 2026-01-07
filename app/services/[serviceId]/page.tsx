'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

interface Service {
    id: string;
    name: string;
    description: string | null;
    repoUrl: string | null;
    retentionDays: number;
}

interface Environment {
    id: string;
    name: string;
    createdAt: string;
}

interface ApiKey {
    id: string;
    environmentId: string;
    environmentName: string;
    maskedKey: string;
    revokedAt: string | null;
    createdAt: string;
}

type Tab = 'environments' | 'keys';

export default function ServiceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const serviceId = params.serviceId as string;

    const [service, setService] = useState<Service | null>(null);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('environments');
    const [error, setError] = useState('');

    // Form states
    const [showEnvForm, setShowEnvForm] = useState(false);
    const [envName, setEnvName] = useState('');
    const [creatingEnv, setCreatingEnv] = useState(false);

    const [showKeyForm, setShowKeyForm] = useState(false);
    const [selectedEnvId, setSelectedEnvId] = useState('');
    const [creatingKey, setCreatingKey] = useState(false);
    const [newRawKey, setNewRawKey] = useState('');

    const loadService = useCallback(async () => {
        try {
            const res = await fetch(`/api/services/${serviceId}`);
            if (res.status === 401 || res.status === 403) {
                router.push('/login');
                return;
            }
            if (res.status === 404) {
                router.push('/services');
                return;
            }
            const data = await res.json();
            setService(data.data?.service);
        } catch {
            setError('Failed to load service');
        }
    }, [serviceId, router]);

    const loadEnvironments = useCallback(async () => {
        try {
            const res = await fetch(`/api/services/${serviceId}/environments`);
            const data = await res.json();
            setEnvironments(data.data?.environments || []);
        } catch {
            console.error('Failed to load environments');
        }
    }, [serviceId]);

    const loadKeys = useCallback(async () => {
        try {
            const res = await fetch(`/api/services/${serviceId}/keys`);
            const data = await res.json();
            setKeys(data.data?.keys || []);
        } catch {
            console.error('Failed to load keys');
        }
    }, [serviceId]);

    useEffect(() => {
        Promise.all([loadService(), loadEnvironments(), loadKeys()]).finally(() => {
            setLoading(false);
        });
    }, [loadService, loadEnvironments, loadKeys]);

    const handleCreateEnv = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreatingEnv(true);

        try {
            const res = await fetch(`/api/services/${serviceId}/environments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: envName }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error?.message || 'Failed to create environment');
                return;
            }

            setEnvName('');
            setShowEnvForm(false);
            await loadEnvironments();
        } catch {
            setError('An error occurred');
        } finally {
            setCreatingEnv(false);
        }
    };

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreatingKey(true);
        setNewRawKey('');

        try {
            const res = await fetch(`/api/services/${serviceId}/keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ environmentId: selectedEnvId }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error?.message || 'Failed to create key');
                return;
            }

            // Show the raw key once
            setNewRawKey(data.data?.key?.rawKey || '');
            setShowKeyForm(false);
            await loadKeys();
        } catch {
            setError('An error occurred');
        } finally {
            setCreatingKey(false);
        }
    };

    const handleRevokeKey = async (keyId: string) => {
        setError('');
        try {
            const res = await fetch(`/api/keys/${keyId}/revoke`, { method: 'POST' });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error?.message || 'Failed to revoke key');
                return;
            }

            await loadKeys();
        } catch {
            setError('An error occurred');
        }
    };

    if (loading) {
        return (
            <AppShell>
                <PageHeader title="Loading..." />
                <Card padding="lg">
                    <SkeletonLoader height="2rem" width="200px" />
                </Card>
            </AppShell>
        );
    }

    if (!service) {
        return null;
    }

    const tabStyle = (tab: Tab) => ({
        padding: 'var(--spacing-sm) var(--spacing-md)',
        backgroundColor: activeTab === tab ? 'var(--color-surface)' : 'transparent',
        border: activeTab === tab ? '1px solid var(--color-border)' : '1px solid transparent',
        borderBottom: activeTab === tab ? '1px solid var(--color-surface)' : '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        marginBottom: '-1px',
        cursor: 'pointer',
        fontSize: 'var(--text-sm)',
        fontWeight: activeTab === tab ? 500 : 400,
    });

    return (
        <AppShell>
            <PageHeader title={service.name} description={service.description || undefined}>
                <Link
                    href="/services"
                    style={{
                        padding: 'var(--spacing-xs) var(--spacing-md)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-sm)',
                        textDecoration: 'none',
                    }}
                >
                    ← Back
                </Link>
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

            {newRawKey && (
                <Card padding="lg" style={{ marginBottom: 'var(--spacing-lg)', backgroundColor: 'var(--color-warning-bg)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        <strong style={{ color: 'var(--color-warning)' }}>⚠️ Save this API key now!</strong>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                            This key will not be shown again. Copy it to a secure location.
                        </p>
                        <code
                            style={{
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: 'var(--radius-md)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-sm)',
                                wordBreak: 'break-all',
                            }}
                        >
                            {newRawKey}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(newRawKey);
                                setNewRawKey('');
                            }}
                            style={{
                                padding: 'var(--spacing-xs) var(--spacing-md)',
                                backgroundColor: 'var(--color-text-primary)',
                                color: 'var(--color-surface)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--text-sm)',
                                cursor: 'pointer',
                                alignSelf: 'flex-start',
                            }}
                        >
                            Copy & Dismiss
                        </button>
                    </div>
                </Card>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--spacing-md)' }}>
                <button onClick={() => setActiveTab('environments')} style={tabStyle('environments')}>
                    Environments ({environments.length})
                </button>
                <button onClick={() => setActiveTab('keys')} style={tabStyle('keys')}>
                    API Keys ({keys.length})
                </button>
            </div>

            {/* Environments Tab */}
            {activeTab === 'environments' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-md)' }}>
                        <button
                            onClick={() => setShowEnvForm(!showEnvForm)}
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
                            {showEnvForm ? 'Cancel' : 'New Environment'}
                        </button>
                    </div>

                    {showEnvForm && (
                        <Card padding="md" style={{ marginBottom: 'var(--spacing-md)' }}>
                            <form onSubmit={handleCreateEnv} style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <input
                                    type="text"
                                    value={envName}
                                    onChange={(e) => setEnvName(e.target.value)}
                                    placeholder="Environment name (e.g., production)"
                                    required
                                    style={{
                                        flex: 1,
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--text-sm)',
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={creatingEnv}
                                    style={{
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        backgroundColor: 'var(--color-text-primary)',
                                        color: 'var(--color-surface)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--text-sm)',
                                        cursor: creatingEnv ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {creatingEnv ? 'Creating...' : 'Create'}
                                </button>
                            </form>
                        </Card>
                    )}

                    {environments.length === 0 ? (
                        <Card padding="lg">
                            <EmptyState
                                title="No environments"
                                description="Create environments like production, staging, or development."
                            />
                        </Card>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {environments.map((env) => (
                                <Card key={env.id} padding="md">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 500 }}>{env.name}</span>
                                        <Badge variant="neutral">{keys.filter((k) => k.environmentId === env.id && !k.revokedAt).length} keys</Badge>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Keys Tab */}
            {activeTab === 'keys' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-md)' }}>
                        <button
                            onClick={() => setShowKeyForm(!showKeyForm)}
                            disabled={environments.length === 0}
                            style={{
                                padding: 'var(--spacing-xs) var(--spacing-md)',
                                backgroundColor: environments.length === 0 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                                color: 'var(--color-surface)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--text-sm)',
                                cursor: environments.length === 0 ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {showKeyForm ? 'Cancel' : 'New API Key'}
                        </button>
                    </div>

                    {showKeyForm && (
                        <Card padding="md" style={{ marginBottom: 'var(--spacing-md)' }}>
                            <form onSubmit={handleCreateKey} style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <select
                                    value={selectedEnvId}
                                    onChange={(e) => setSelectedEnvId(e.target.value)}
                                    required
                                    style={{
                                        flex: 1,
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--text-sm)',
                                    }}
                                >
                                    <option value="">Select environment...</option>
                                    {environments.map((env) => (
                                        <option key={env.id} value={env.id}>
                                            {env.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    disabled={creatingKey || !selectedEnvId}
                                    style={{
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        backgroundColor: 'var(--color-text-primary)',
                                        color: 'var(--color-surface)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--text-sm)',
                                        cursor: creatingKey ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {creatingKey ? 'Creating...' : 'Create Key'}
                                </button>
                            </form>
                        </Card>
                    )}

                    {keys.length === 0 ? (
                        <Card padding="lg">
                            <EmptyState
                                title="No API keys"
                                description={environments.length === 0 ? 'Create an environment first, then generate API keys.' : 'Generate API keys for your environments.'}
                            />
                        </Card>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {keys.map((key) => (
                                <Card key={key.id} padding="md">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>{key.maskedKey}</code>
                                            <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                                {key.environmentName}
                                            </span>
                                        </div>
                                        {key.revokedAt ? (
                                            <Badge variant="error">Revoked</Badge>
                                        ) : (
                                            <button
                                                onClick={() => handleRevokeKey(key.id)}
                                                style={{
                                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                    backgroundColor: 'transparent',
                                                    color: 'var(--color-error)',
                                                    border: '1px solid var(--color-error)',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontSize: 'var(--text-xs)',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Revoke
                                            </button>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </AppShell>
    );
}
