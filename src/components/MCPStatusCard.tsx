import React from 'react';
import { useMCPStore } from '../store/mcpStore';
import { Radio, Activity, Cpu, CheckCircle2, XCircle } from 'lucide-react';

export const MCPStatusCard: React.FC = () => {
  const { status, latency, handshake, isMockMode } = useMCPStore();

  const capabilitiesList = [
    { key: 'tools', label: 'Tools Discovery', desc: 'Allows executing tools via client calls' },
    { key: 'resources', label: 'Resources Access', desc: 'Exposes raw file/database contexts' },
    { key: 'prompts', label: 'Prompts Library', desc: 'Exposes pre-engineered agent prompts' },
    { key: 'logging', label: 'Server Logging', desc: 'Enables streaming logs back to IDE' },
    { key: 'sampling', label: 'Model Sampling', desc: 'Allows server to prompt client models' },
  ] as const;

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between h-full">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div>
        <h2 className="text-base font-semibold text-zinc-100 flex items-center space-x-2.5 mb-6">
          <Cpu className="w-4.5 h-4.5 text-blue-400" />
          <span>Server Capabilities & Handshake</span>
        </h2>

        {status === 'connected' && handshake ? (
          <div className="space-y-5">
            {/* Identity details */}
            <div className="grid grid-cols-2 gap-4 bg-[#09090b] p-4 rounded-lg border border-zinc-800/80 font-mono text-xs">
              <div>
                <span className="text-zinc-500 block mb-1">PROTOCOL VERSION</span>
                <span className="text-zinc-300 font-medium">{handshake.protocolVersion}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">LATENCY (ROUNDTRIP)</span>
                <span className="text-emerald-400 font-medium flex items-center space-x-1">
                  <Activity className="w-3.5 h-3.5 inline text-emerald-500 animate-pulse" />
                  <span>{latency !== null ? `${latency} ms` : 'N/A'}</span>
                </span>
              </div>
              <div className="col-span-2 border-t border-zinc-800/60 pt-3">
                <span className="text-zinc-500 block mb-1">MCP RUNTIME VERSION</span>
                <span className="text-zinc-300 font-medium text-[11px] truncate block">
                  {handshake.serverName} ({handshake.serverVersion})
                </span>
              </div>
            </div>

            {/* Capability indicators */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider block">
                Feature Support Status
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {capabilitiesList.map(cap => {
                  const isSupported = !!handshake.capabilities[cap.key];
                  return (
                    <div
                      key={cap.key}
                      className={`flex items-start space-x-2.5 p-2 rounded-lg border transition-colors duration-150 ${
                        isSupported
                          ? 'bg-emerald-500/5 border-emerald-500/10'
                          : 'bg-zinc-900/30 border-zinc-800/40 opacity-60'
                      }`}
                    >
                      {isSupported ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className={`text-xs font-semibold ${isSupported ? 'text-zinc-200' : 'text-zinc-500'}`}>
                          {cap.label}
                        </span>
                        <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                          {cap.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-[#09090b] rounded-lg border border-dashed border-[#27272a]">
            <Radio className="w-8 h-8 text-zinc-600 mb-3 animate-pulse" />
            <p className="text-xs text-zinc-400 font-medium">MCP Handshake Pending</p>
            <p className="text-[10px] text-zinc-600 max-w-[200px] mt-1.5 leading-relaxed">
              Verify server connection to analyze active capabilities, server identity, and latency.
            </p>
          </div>
        )}
      </div>

      {status === 'connected' && isMockMode && (
        <div className="mt-4 text-[10px] text-center text-zinc-500 font-mono bg-zinc-900/45 p-2 rounded border border-zinc-800/50">
          * Running in Simulated (Mock) Sandbox Mode.
        </div>
      )}
    </div>
  );
};
