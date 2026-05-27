import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { GraphPage } from './pages/GraphPage';
import { PlatformPage } from './pages/marketing/PlatformPage';
import { FeaturesPage } from './pages/marketing/FeaturesPage';
import { TechnologyPage } from './pages/marketing/TechnologyPage';
import { WorkflowPage } from './pages/marketing/WorkflowPage';
import { AboutPage } from './pages/marketing/AboutPage';
import { PricingPage } from './pages/marketing/PricingPage';
import { ContactPage } from './pages/marketing/ContactPage';
import { DocsPage } from './pages/marketing/DocsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/platform" element={<PlatformPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/technology" element={<TechnologyPage />} />
      <Route path="/workflow" element={<WorkflowPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/app" element={<GraphPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

