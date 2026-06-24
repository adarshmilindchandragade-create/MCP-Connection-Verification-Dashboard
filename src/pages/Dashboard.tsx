import React from 'react';
import { useMCPStore } from '../store/mcpStore';
import { ConnectionPanel } from '../components/ConnectionPanel';
import { Timeline } from '../components/Timeline';
import { DebugConsole } from '../components/DebugConsole';
import { Wrench, Cpu, AlertTriangle, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { tools, status, timeline, metrics } = useMCPStore();

  const cards = [
    {
      title: 'Discovered Tools',
      value: status === 'connected' ? tools.length : 0,
      icon: Wrench,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/5 border-indigo-500/10'
    },
    {
      title: 'Active Servers',
      value: status === 'connected' ? 1 : 0,
      icon: Cpu,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/5 border-emerald-500/10'
    },
    {
      title: 'Failed Operations',
      value: metrics.failedRequests,
      icon: AlertTriangle,
      color: metrics.failedRequests > 0 ? 'text-rose-400' : 'text-zinc-500',
      bg: metrics.failedRequests > 0 ? 'bg-rose-500/5 border-rose-500/10' : 'bg-zinc-900/30 border-zinc-800/40'
    },
    {
      title: 'Avg Delay Response',
      value: status === 'connected' ? `${metrics.avgResponseTime}ms` : '0ms',
      icon: Activity,
      color: 'text-sky-400',
      bg: 'bg-sky-500/5 border-sky-500/10'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">System Status Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
          Verify and monitor MCP server connectivity, discover exposed functions, and trace protocol payloads in real time.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`p-6 rounded-xl border ${card.bg} shadow-lg transition-transform duration-150 hover:-translate-y-0.5`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 font-sans tracking-wide uppercase">
                  {card.title}
                </span>
                <Icon className={`w-4.5 h-4.5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-zinc-100 mt-3 font-mono leading-none">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Config & Timeline Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ConnectionPanel />
        </div>
        <div className="lg:col-span-2">
          <Timeline events={timeline} />
        </div>
      </div>

      {/* Live Stream Terminal Console */}
      <div>
        <DebugConsole />
      </div>
    </div>
  );
};
