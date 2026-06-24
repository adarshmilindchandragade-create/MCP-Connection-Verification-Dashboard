import React, { useState } from 'react';
import { useMCPStore } from '../store/mcpStore';
import { ShieldAlert, Wifi, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const TrafficMonitor: React.FC = () => {
  const { trafficLogs, clearTrafficLogs } = useMCPStore();
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Group requests and responses by method/timestamp or keep flat log
  const selectedLog = trafficLogs.find(log => log.id === selectedLogId) || trafficLogs[0];

  // Helper to colorize JSON
  const syntaxHighlight = (json: any): string => {
    if (!json) return '<span class="text-zinc-500">null</span>';
    let str = typeof json !== 'string' ? JSON.stringify(json, null, 2) : json;
    
    // Escape HTML characters
    str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
      let cls = 'text-amber-500'; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-emerald-400 font-semibold'; // key
        } else {
          cls = 'text-blue-300'; // string
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-400'; // boolean
      } else if (/null/.test(match)) {
        cls = 'text-zinc-500'; // null
      }
      return `<span class="${cls}">${match}</span>`;
    });
  };

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-xl flex flex-col h-[550px]">
      {/* Header bar */}
      <div className="bg-[#0c0c0e] border-b border-[#27272a] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
          <h3 className="text-sm font-semibold text-zinc-100">MCP Protocol Traffic Monitor</h3>
        </div>
        <button
          onClick={clearTrafficLogs}
          className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors duration-150"
          title="Clear traffic history"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Split Panel */}
      {trafficLogs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#0e0e11]">
          <Wifi className="w-8 h-8 text-zinc-700 mb-3" />
          <p className="text-xs text-zinc-500 font-mono">Listening for protocol packets...</p>
          <p className="text-[10px] text-zinc-600 max-w-[240px] mt-1.5">
            Logs of handshake configurations, tool discovery lists, resource lists, and executions will stream here.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex divide-x divide-[#27272a] overflow-hidden">
          {/* List panel (Left) */}
          <div className="w-1/3 overflow-y-auto bg-[#0f0f12]">
            <table className="w-full text-left border-collapse text-[11px] font-mono">
              <thead>
                <tr className="border-b border-[#27272a] text-zinc-500 uppercase tracking-wider sticky top-0 bg-[#0f0f12] z-10">
                  <th className="px-4 py-2 bg-[#0f0f12]">Time</th>
                  <th className="px-4 py-2 bg-[#0f0f12]">Method / Node</th>
                  <th className="px-4 py-2 bg-[#0f0f12]">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {trafficLogs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  const isReq = log.direction === 'request';
                  const time = new Date(log.timestamp).toLocaleTimeString();
                  
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id)}
                      className={`cursor-pointer transition-colors duration-150 hover:bg-zinc-800/20 ${
                        isSelected ? 'bg-zinc-800/45 border-l-2 border-emerald-500' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 text-zinc-500">{time}</td>
                      <td className="px-4 py-2.5 text-zinc-300 font-medium">
                        <div className="flex items-center space-x-1.5">
                          {isReq ? (
                            <ArrowUpRight className="w-3 h-3 text-blue-400 shrink-0" />
                          ) : log.error ? (
                            <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-400 shrink-0" />
                          )}
                          <span className="truncate max-w-[120px]" title={log.method}>
                            {log.method}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        {log.duration !== undefined ? (
                          <span className={log.duration > 200 ? 'text-amber-400' : 'text-emerald-400'}>
                            {log.duration}ms
                          </span>
                        ) : log.error ? (
                          <span className="text-rose-500 font-medium">Err</span>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Details panel (Right) */}
          <div className="w-2/3 flex flex-col bg-[#0b0b0d] overflow-hidden">
            {selectedLog ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Meta details header */}
                <div className="px-6 py-3 border-b border-[#27272a] bg-[#0c0c0e] flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center space-x-4">
                    <span>
                      <strong className="text-zinc-500">Direction:</strong>{' '}
                      <span className={selectedLog.direction === 'request' ? 'text-blue-400' : 'text-emerald-400'}>
                        {selectedLog.direction.toUpperCase()}
                      </span>
                    </span>
                    <span>
                      <strong className="text-zinc-500">Method:</strong>{' '}
                      <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-[10px]">
                        {selectedLog.method}
                      </code>
                    </span>
                  </div>
                  {selectedLog.duration && (
                    <span className="font-mono text-zinc-400">
                      Elapsed: <span className="text-emerald-400 font-bold">{selectedLog.duration}ms</span>
                    </span>
                  )}
                </div>

                {/* Log Payload display */}
                <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-relaxed space-y-4">
                  {selectedLog.error && (
                    <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-lg text-rose-400">
                      <span className="font-semibold text-rose-500 block mb-1">Execution Failure:</span>
                      {selectedLog.error}
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-2">
                      Payload JSON
                    </span>
                    <pre 
                      className="bg-[#09090b] border border-zinc-800/80 rounded-lg p-4 overflow-x-auto text-[11px]"
                      dangerouslySetInnerHTML={{ __html: syntaxHighlight(selectedLog.payload) }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 text-center text-zinc-600 text-xs">
                Select a protocol packet from the left log table to inspect details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
