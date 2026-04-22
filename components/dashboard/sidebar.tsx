'use client';

import { Activity, Network, BarChart3, Brain, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: 'threat-feed', label: 'Live Threat Feed', icon: Activity },
  { id: 'behavior-graph', label: 'User Behavior Graph', icon: Network },
  { id: 'model-performance', label: 'Model Performance', icon: BarChart3 },
  { id: 'explainability', label: 'Alert Explainability', icon: Brain },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
      <nav className="flex-1 py-4">
        <div className="px-4 mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Dashboard
          </span>
        </div>
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive && 'text-[#3B82F6]')} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <HelpCircle className="h-4 w-4" />
            Documentation
          </button>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <p>Model: TGN + BiLSTM</p>
            <p>Dataset: CERT v4.2</p>
            <p className="mt-1 font-mono text-[10px]">v2.4.1</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
