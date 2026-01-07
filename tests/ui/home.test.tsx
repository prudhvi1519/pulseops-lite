import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('Home Page', () => {
    it('displays "System Status: OK (mock)"', () => {
        render(<HomePage />);

        expect(screen.getByText('System Status: OK (mock)')).toBeInTheDocument();
    });

    it('displays version string', () => {
        const { container } = render(<HomePage />);

        // In test environment, VERCEL_GIT_COMMIT_SHA is not set, so it should show 'dev'
        const codeElement = container.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        expect(codeElement?.textContent).toBe('dev');
    });

    it('displays operational badge', () => {
        const { container } = render(<HomePage />);

        // Find text content in the rendered output
        expect(container.textContent).toContain('Operational');
    });
});
