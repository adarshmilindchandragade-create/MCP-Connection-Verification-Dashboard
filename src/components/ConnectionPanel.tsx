import React, { useState } from 'react';
import { useMCPStore } from '../store/mcpStore';
import { Link2, Link2Off, Loader2, Play } from 'lucide-react';

export const ConnectionPanel: React.FC = () => {
  const { config, setConfig, status, connect, disconnect, errorMsg } = useMCPStore();
  const [argsInput, setArgsInput] = useState(config.args?.join(' ') || '');

  const handleTypeChange = (type: 'sse' | 'stdio') => {
    setConfig({ type });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ url: e.target.value });
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ token: e.target.value });
  };

  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ command: e.target.value });
  };

  const handleArgsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setArgsInput(val);
    setConfig({ args: val.split(' ').filter(a => a.trim() !== '') });
  };

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected';

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <h2 className="text-base font-semibold text-zinc-100 flex items-center space-x-2.5 mb-6">
        <Link2 className="w-4.5 h-4.5 text-emerald-400" />
        <span>MCP Server Connection Settings</span>
      </h2>

      {/* Tabs */}
      <div className="flex bg-[#09090b] p-1 rounded-lg border border-[#27272a] mb-6">
        <button
          onClick={() => handleTypeChange('sse')}
          disabled={isConnected || isConnecting}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
            config.type === 'sse'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          SSE Transport (HTTP)
        </button>
        <button
          onClick={() => handleTypeChange('stdio')}
          disabled={isConnected || isConnecting}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
            config.type === 'stdio'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Stdio Process (Local Command)
        </button>
      </div>

      <div className="space-y-4">
        {config.type === 'sse' ? (
          <>
            <div>
              <label className="block text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Server Endpoint URL
              </label>
              <input
                type="text"
                value={config.url}
                onChange={handleUrlChange}
                disabled={isConnected || isConnecting}
                placeholder="e.g. http://localhost:5678/rest/mcp"
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors duration-200 font-mono disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Bearer / API Token (Optional)
              </label>
              <input
                type="password"
                value={config.token || ''}
                onChange={handleTokenChange}
                disabled={isConnected || isConnecting}
                placeholder="Enter API auth token if required"
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors duration-200 font-mono disabled:opacity-50"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Subprocess Command
              </label>
              <input
                type="text"
                value={config.command}
                onChange={handleCommandChange}
                disabled={isConnected || isConnecting}
                placeholder="e.g. npx, node, python"
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors duration-200 font-mono disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                Arguments (Space Separated)
              </label>
              <input
                type="text"
                value={argsInput}
                onChange={handleArgsChange}
                disabled={isConnected || isConnecting}
                placeholder="e.g. -y @modelcontextprotocol/server-everything"
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors duration-200 font-mono disabled:opacity-50"
              />
            </div>
          </>
        )}

        <div className="pt-2 flex items-center space-x-3">
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium py-2 rounded-lg transition-colors duration-200 border border-zinc-700 hover:border-zinc-600 flex items-center justify-center space-x-2"
            >
              <Link2Off className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:hover:bg-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:shadow-[0_4px_16px_rgba(16,185,129,0.25)]"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Check Connection</span>
                </>
              )}
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-500/5 border border-rose-500/15 rounded-lg text-rose-400 text-xs font-mono break-words leading-relaxed">
            <span className="font-semibold">Error:</span> {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};
