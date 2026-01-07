import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: process.env.NEXT_PUBLIC_APP_NAME || 'PulseOps Lite',
    description: 'Lightweight operations monitoring platform',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
