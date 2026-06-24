import React, { useState } from 'react';
import { useMCPStore } from '../store/mcpStore';
import { ConnectionPanel } from '../components/ConnectionPanel';
import { MCPStatusCard } from '../components/MCPStatusCard';
import { TrafficMonitor } from '../components/TrafficMonitor';
import { DebugConsole } from '../components/DebugConsole';
import { Shield, Hammer, Library, HelpCircle } from 'lucide-react';

export const Inspector: React.FC = () => {
  const { tools, resources, prompts, status } = useMCPStore();
  const [activeListTab, setActiveListTab] = useState<'tools' | 'resources' | 'prompts'>('tools');

  const isConnected = status === 'connected';

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center space-x-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span>Unified Protocol Inspector</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
            All-in-one diagnostic console. Troubleshoot connection health, monitor json payloads, and inspect schema properties in 30 seconds.
          </p>
        </div>
      </div>

      {/* Row 1: Connection Config + Handshake Capabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <ConnectionPanel />
        </div>
        <div>
          <MCPStatusCard />
        </div>
      </div>

      {/* Row 2: Discovered Objects List (Left) + Raw Traffic JSON (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Discovered Items Selector (5 cols) */}
        <div className="xl:col-span-4 bg-[#18181b] border border-[#27272a] rounded-xl p-5 shadow-xl flex flex-col h-[550px] overflow-hidden">
          <div className="flex bg-[#09090b] p-1 rounded-lg border border-[#27272a] mb-4 shrink-0">
            <button
              onClick={() => setActiveListTab('tools')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 flex items-center justify-center space-x-1.5 ${
                activeListTab === 'tools'
                  ? 'bg-zinc-800 text-indigo-400 border border-zinc-700 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Tools ({isConnected ? tools.length : 0})</span>
            </button>
            <button
              onClick={() => setActiveListTab('resources')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 flex items-center justify-center space-x-1.5 ${
                activeListTab === 'resources'
                  ? 'bg-zinc-800 text-sky-400 border border-zinc-700 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>Resources ({isConnected ? resources.length : 0})</span>
            </button>
            <button
              onClick={() => setActiveListTab('prompts')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 flex items-center justify-center space-x-1.5 ${
                activeListTab === 'prompts'
                  ? 'bg-zinc-800 text-purple-400 border border-zinc-700 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Prompts ({isConnected ? prompts.length : 0})</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {!isConnected ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-zinc-600">
                <Shield className="w-8 h-8 text-zinc-700 mb-2" />
                <span className="text-xs font-mono">No Active Connection</span>
              </div>
            ) : activeListTab === 'tools' ? (
              tools.length === 0 ? (
                <div className="text-center text-xs text-zinc-500 py-8">No tools found on server.</div>
              ) : (
                tools.map(tool => (
                  <div key={tool.name} className="p-3 bg-[#09090b] border border-zinc-800/80 rounded-lg hover:border-zinc-700/60 transition-colors">
                    <span className="font-mono text-xs font-semibold text-zinc-100 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2 shrink-0" />
                      {tool.name}
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed truncate-2-lines">
                      {tool.description}
                    </p>
                  </div>
                ))
              )
            ) : activeListTab === 'resources' ? (
              resources.length === 0 ? (
                <div className="text-center text-xs text-zinc-500 py-8">No resources exposed by server.</div>
              ) : (
                resources.map(res => (
                  <div key={res.uri} className="p-3 bg-[#09090b] border border-zinc-800/80 rounded-lg hover:border-zinc-700/60 transition-colors">
                    <span className="font-mono text-xs font-semibold text-zinc-100 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-2 shrink-0" />
                      {res.name}
                    </span>
                    <code className="text-[9px] text-sky-400 font-mono block mt-1.5 truncate">
                      {res.uri}
                    </code>
                    {res.description && (
                      <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                        {res.description}
                      </p>
                    )}
                  </div>
                ))
              )
            ) : (
              prompts.length === 0 ? (
                <div className="text-center text-xs text-zinc-500 py-8">No prompt models exposed by server.</div>
              ) : (
                prompts.map(p => (
                  <div key={p.name} className="p-3 bg-[#09090b] border border-zinc-800/80 rounded-lg hover:border-zinc-700/60 transition-colors">
                    <span className="font-mono text-xs font-semibold text-zinc-100 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2 shrink-0" />
                      {p.name}
                    </span>
                    {p.description && (
                      <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                    {p.arguments && p.arguments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.arguments.map(arg => (
                          <span
                            key={arg.name}
                            className={`text-[8px] font-mono px-1 py-0.5 rounded ${
                              arg.required ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-zinc-800 text-zinc-400'
                            }`}
                            title={arg.description}
                          >
                            {arg.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Traffic Monitor (8 cols) */}
        <div className="xl:col-span-8">
          <TrafficMonitor />
        </div>
      </div>

      {/* Row 3: Debug Console */}
      <div>
        <DebugConsole />
      </div>
    </div>
  );
};
