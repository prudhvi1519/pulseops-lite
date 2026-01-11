import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { CredibilityStrip } from '@/components/landing/CredibilityStrip';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { ProofPanel } from '@/components/landing/ProofPanel';
import { PRDShowroom } from '@/components/landing/PRDShowroom';
import { TechStackSection } from '@/components/landing/TechStackSection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function LandingPage() {
    return (
        <>
            <LandingNavbar />
            <main>
                <HeroSection />
                <CredibilityStrip />
                <FeatureGrid />
                <ProofPanel />
                <PRDShowroom />
                <TechStackSection />
            </main>
            <LandingFooter />
        </>
    );
}
