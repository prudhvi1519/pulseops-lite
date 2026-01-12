import '@testing-library/jest-dom/vitest';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Mock IntersectionObserver for JSDOM
class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];

    constructor(
        private callback: IntersectionObserverCallback,
        _options?: IntersectionObserverInit
    ) { }

    observe(): void { }
    unobserve(): void { }
    disconnect(): void { }
    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }
}

global.IntersectionObserver = MockIntersectionObserver;

