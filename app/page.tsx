'use client';

import { useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { Sidebar } from '@/components/dashboard/sidebar';
import { LiveThreatFeed } from '@/components/dashboard/live-threat-feed';
import { UserBehaviorGraph } from '@/components/dashboard/user-behavior-graph';
import { ModelPerformance } from '@/components/dashboard/model-performance';
import { AlertExplainability } from '@/components/dashboard/alert-explainability';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('threat-feed');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'threat-feed':
        return <LiveThreatFeed />;
      case 'behavior-graph':
        return <UserBehaviorGraph />;
      case 'model-performance':
        return <ModelPerformance />;
      case 'explainability':
        return <AlertExplainability />;
      default:
        return <LiveThreatFeed />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} onSectionChange={setActiveSection} />
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-2 lg:p-6 overflow-hidden">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
