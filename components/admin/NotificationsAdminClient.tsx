'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { EmptyState } from '../ui/EmptyState';

interface Channel {
    id: string;
    type: 'discord' | 'slack';
    config: { webhookUrl: string };
    enabled: boolean;
    createdAt: string;
}

interface Job {
    id: string;
    type: string;
    status: 'pending' | 'processing' | 'sent' | 'failed';
    attempts: number;
    lastError?: string;
    createdAt: string;
}

// Helper components to match Card usage if Card.tsx doesn't export them
const CardHeader = ({ children, className = '' }: any) => <div className={`p-6 pb-0 ${className}`}>{children}</div>; // eslint-disable-line @typescript-eslint/no-explicit-any
const CardTitle = ({ children, className = '' }: any) => <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>; // eslint-disable-line @typescript-eslint/no-explicit-any
const CardContent = ({ children, className = '' }: any) => <div className={`p-6 pt-0 ${className}`}>{children}</div>; // eslint-disable-line @typescript-eslint/no-explicit-any

interface NotificationsAdminClientProps {
    initialChannels?: Channel[];
    initialJobs?: Job[];
}

export function NotificationsAdminClient({ initialChannels, initialJobs }: NotificationsAdminClientProps) {
    const [channels, setChannels] = useState<Channel[]>(initialChannels || []);
    const [jobs, setJobs] = useState<Job[]>(initialJobs || []);
    // Only load if no initial data provided, or separate loading state logic?
    // If initial data is provided, we assume we don't need to fetch immediately or we do?
    // For smoke testing, we just want to render.
    // Let's rely on effective "if (initial) dont fetch" or just let fetch override?
    // A stable test would prefer NO fetch if data is provided, or at least no layout shift.
    // Let's set loading to false if initial data exists.
    const [loading, setLoading] = useState(!initialChannels && !initialJobs);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newChannelType, setNewChannelType] = useState<'discord' | 'slack'>('discord');
    const [newWebhookUrl, setNewWebhookUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if ((!initialChannels || initialChannels.length === 0) && (!initialJobs || initialJobs.length === 0)) {
            fetchData();
        }
    }, [initialChannels, initialJobs]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [channelsRes, jobsRes] = await Promise.all([
                fetch('/api/notifications/channels/query'),
                fetch('/api/notifications/jobs/recent')
            ]);

            if (!channelsRes.ok) throw new Error('Failed to fetch channels');
            const channelsData = await channelsRes.json();
            console.log('DEBUG CHANNELS:', channelsData);
            if (channelsData.data && channelsData.data.length > 0) {
                throw new Error(`DEBUG_CHANNELS_LOADED: ${JSON.stringify(channelsData.data)}`);
            }
            setChannels(channelsData.data || []);

            if (jobsRes.ok) {
                const jobsData = await jobsRes.json();
                setJobs(jobsData.data || []);
            }
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateChannel = async () => {
        if (!newWebhookUrl) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/notifications/channels/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: newChannelType,
                    config: { webhookUrl: newWebhookUrl }
                })
            });

            if (!res.ok) throw new Error('Failed to create channel');

            await fetchData();
            setIsModalOpen(false);
            setNewWebhookUrl('');
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleChannel = async (id: string, enabled: boolean) => {
        try {
            await fetch(`/api/notifications/channels/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled })
            });
            // Optimistic update
            setChannels(prev => prev.map(c => c.id === id ? { ...c, enabled } : c));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteChannel = async (id: string) => {
        if (!confirm('Are you sure you want to delete this channel?')) return;
        try {
            await fetch(`/api/notifications/channels/${id}`, { method: 'DELETE' });
            // Optimistic update
            setChannels(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <Card>
                    <CardHeader><SkeletonLoader height="30px" width="200px" /></CardHeader>
                    <CardContent>
                        <SkeletonLoader height="100px" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><SkeletonLoader height="30px" width="200px" /></CardHeader>
                    <CardContent>
                        <SkeletonLoader height="100px" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    if (error) return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="space-y-8">
            {/* Channels Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Notification Channels</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Manage external webhooks for Slack and Discord.</p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)}>Add Channel</Button>
                </CardHeader>
                <CardContent>
                    {channels.length === 0 ? (
                        <EmptyState
                            title="No Channels Configured"
                            description="Add a Slack or Discord webhook to receive incident alerts."
                            action={
                                <Button onClick={() => setIsModalOpen(true)}>
                                    Configure Channel
                                </Button>
                            }
                        />
                    ) : (
                        <div className="space-y-4">
                            {channels.map(channel => (
                                <div key={channel.id} className="flex items-center justify-between p-4 border rounded-md">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2 bg-muted rounded">
                                            {channel.type === 'discord' ? (
                                                <span role="img" aria-label="discord">🎮</span>
                                            ) : (
                                                <span role="img" aria-label="slack">💬</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium capitalize flex items-center gap-2">
                                                {channel.type}
                                                <Badge variant={channel.enabled ? 'success' : 'neutral'}>
                                                    {channel.enabled ? 'Active' : 'Disabled'}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                                                {channel.config.webhookUrl}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleChannel(channel.id, !channel.enabled)}
                                        >
                                            {channel.enabled ? 'Disable' : 'Enable'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteChannel(channel.id)}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="w-4 h-4"
                                            >
                                                <path d="M3 6h18" />
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                            </svg>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Diagnostics Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Recent Job Diagnostics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {jobs.length === 0 ? (
                        <div className="py-8">
                            <EmptyState
                                title="No Jobs Found"
                                description="Diagnostic logs for notification delivery will appear here."
                            />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium">
                                    <tr className="border-b">
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Type</th>
                                        <th className="p-3">Attempts</th>
                                        <th className="p-3">Created At</th>
                                        <th className="p-3">Error</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {jobs.map(job => (
                                        <tr key={job.id} className="hover:bg-muted/50">
                                            <td className="p-3">
                                                <Badge variant={
                                                    job.status === 'sent' ? 'success' :
                                                        job.status === 'failed' ? 'error' :
                                                            'neutral'
                                                }>
                                                    {job.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3 font-mono text-xs">{job.type}</td>
                                            <td className="p-3">{job.attempts}</td>
                                            <td className="p-3 text-muted-foreground">
                                                {new Date(job.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-red-500 max-w-[200px] truncate" title={job.lastError}>
                                                {job.lastError || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Notification Channel</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Channel Type</Label>
                            <Select
                                value={newChannelType}
                                onValueChange={(v: any) => setNewChannelType(v)} // eslint-disable-line @typescript-eslint/no-explicit-any
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="discord">Discord</SelectItem>
                                    <SelectItem value="slack">Slack</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Webhook URL</Label>
                            <Input
                                placeholder="https://..."
                                value={newWebhookUrl}
                                onChange={(e: any) => setNewWebhookUrl(e.target.value)} // eslint-disable-line @typescript-eslint/no-explicit-any
                            />
                            <p className="text-xs text-muted-foreground">
                                Paste the incoming webhook URL provided by Slack or Discord.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateChannel} disabled={submitting || !newWebhookUrl}>
                            {submitting ? 'Adding...' : 'Add Channel'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
