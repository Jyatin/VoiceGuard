import { useState } from 'react';
import { useHealth } from './hooks/useHealth';
import { Navigation } from './components/site/Navigation';
import { SystemStatus } from './components/site/SystemStatus';
import { Hero } from './components/site/Hero';
import { ProblemSection } from './components/site/ProblemSection';
import { EngineComparison } from './components/site/EngineComparison';
import { LiveDetector } from './components/LiveDetector';
import { AcousticSignals } from './components/site/AcousticSignals';
import { ForensicAnalyzer } from './components/ForensicAnalyzer';
import { PerformanceSection } from './components/site/PerformanceSection';
import { ArchitecturePipeline } from './components/site/ArchitecturePipeline';
import { TechnicalDetails } from './components/site/TechnicalDetails';
import { FinalCTA, Footer } from './components/site/FinalCTA';
import type { PredictionResponse } from './types';

export function App() {
  const { health, online, isMock } = useHealth();
  const [lastResult, setLastResult] = useState<PredictionResponse | null>(null);

  return (
    <>
      <SystemStatus health={health} online={online} isMock={isMock} />
      <Navigation />
      <main>
        <Hero />
        <ProblemSection />
        <EngineComparison health={health} />
        <LiveDetector isMock={isMock} />
        <AcousticSignals stats={lastResult?.stats ?? null} />
        <ForensicAnalyzer isMock={isMock} onResult={setLastResult} />
        <PerformanceSection />
        <ArchitecturePipeline />
        <TechnicalDetails />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

export default App;
