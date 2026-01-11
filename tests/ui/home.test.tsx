import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import LandingPage from '@/app/page';

describe('Landing Page', () => {
    it('renders the landing page with hero content', () => {
        const { container } = render(<LandingPage />);

        // Hero headline
        expect(container.textContent).toContain('Ship with confidence');
        expect(container.textContent).toContain('Debug with context');
    });

    it('displays navigation and CTAs', () => {
        const { container } = render(<LandingPage />);

        // Navbar
        expect(container.textContent).toContain('PulseOps');
        expect(container.textContent).toContain('Get Started');
    });

    it('displays credibility strip with metrics', () => {
        const { container } = render(<LandingPage />);

        expect(container.textContent).toContain('13 SQL Migrations');
        expect(container.textContent).toContain('37 API Routes');
        expect(container.textContent).toContain('16 DB Tables');
    });

    it('displays feature section', () => {
        const { container } = render(<LandingPage />);

        expect(container.textContent).toContain("What's inside");
        expect(container.textContent).toContain('Organizations & Teams');
        expect(container.textContent).toContain('RBAC Built In');
    });

    it('displays PRD showroom section', () => {
        const { container } = render(<LandingPage />);

        expect(container.textContent).toContain('Under the Hood');
        expect(container.textContent).toContain('Overview');
    });
});
