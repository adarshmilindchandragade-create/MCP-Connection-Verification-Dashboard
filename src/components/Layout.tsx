import React from 'react';
import { LayoutDashboard, Terminal, Wrench, Activity, AlertCircle, Radio } from 'lucide-react';
import { useMCPStore } from '../store/mcpStore';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, setCurrentPage }) => {
  const { status, latency, handshake, isMockMode, setMockMode } = useMCPStore();

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'inspector', name: 'Inspector Panel', icon: Terminal },
    { id: 'tools', name: 'Tools Explorer', icon: Wrench },
    { id: 'health', name: 'Health & Tests', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#27272a] bg-[#0c0c0e] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-[#27272a] flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">MCP Inspector</h1>
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider">ANTIGRAVITY IDE</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5">
            {navigation.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mock Mode Toggle & Info */}
        <div className="p-4 border-t border-[#27272a] space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-zinc-300">Mock Sandbox</span>
              <span className="text-[9px] text-zinc-500">Run without local server</span>
            </div>
            <button
              onClick={() => setMockMode(!isMockMode)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                isMockMode ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 transform ${
                  isMockMode ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isMockMode && (
            <div className="flex items-center space-x-2 text-[10px] text-amber-500 bg-amber-500/5 border border-amber-500/15 p-2 rounded">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Simulated environment active.</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-[#27272a] bg-[#0c0c0e] px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Active Server</span>
            <span className="text-xs font-mono text-zinc-400">/</span>
            <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 px-2 py-0.5 rounded">
              {handshake?.serverName || (isMockMode ? 'n8n-mcp-mock' : 'none')}
            </span>
          </div>

          <div className="flex items-center space-x-6">
            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'connected'
                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : status === 'connecting'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-medium capitalize text-zinc-300">
                {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
              {status === 'connected' && latency !== null && (
                <span className="text-xs text-zinc-500 font-mono">({latency}ms)</span>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
