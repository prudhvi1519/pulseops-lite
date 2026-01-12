'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
                    <div className="mt-4">
                        <SkeletonLoader height="3rem" />
                    </div>
                </Card>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <PageHeader
                title="Services"
                description="Manage your services and their environments"
            >
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : 'New Service'}
                </Button>
            </PageHeader>

            {error && (
                <div className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                    {error}
                </div>
            )}

            {showForm && (
                <Card padding="lg" className="mb-6">
                    <form onSubmit={handleCreate}>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-1 block text-sm font-medium text-foreground"
                                >
                                    Service Name
                                </label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="e.g. auth-service"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="description"
                                    className="mb-1 block text-sm font-medium text-foreground"
                                >
                                    Description (optional)
                                </label>
                                <Input
                                    id="description"
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description of the service"
                                />
                            </div>
                            <Button type="submit" disabled={creating} className="w-fit">
                                {creating ? 'Creating...' : 'Create Service'}
                            </Button>
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
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M12 8v8" />
                                <path d="M8 12h8" />
                            </svg>
                        }
                        action={
                            !showForm ? (
                                <Button onClick={() => setShowForm(true)}>
                                    Create Service
                                </Button>
                            ) : undefined
                        }
                    />
                </Card>
            ) : (
                <div className="flex flex-col gap-3">
                    {services.map((service) => (
                        <Card key={service.id} padding="md" hover>
                            <Link
                                href={`/services/${service.id}`}
                                className="flex items-center justify-between"
                            >
                                <div>
                                    <h3 className="font-medium text-foreground">
                                        {service.name}
                                    </h3>
                                    {service.description && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {service.description}
                                        </p>
                                    )}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {service.envCount} env{service.envCount !== 1 ? 's' : ''}
                                </span>
                            </Link>
                        </Card>
                    ))}
                </div>
            )}

            <div className="mt-8">
                <Link
                    href="/dashboard"
                    className="text-sm text-primary hover:underline hover:text-primary/80"
                >
                    ← Back to Dashboard
                </Link>
            </div>
        </AppShell>
    );
}
