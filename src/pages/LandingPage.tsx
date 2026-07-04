import { Hero } from '@/components/landing/Hero';
import { AnimatedBackground } from '@/components/landing/AnimatedBackground';

export function LandingPage() {
  return (
    <div className="relative">
      <AnimatedBackground />
      <Hero />
    </div>
  );
}
