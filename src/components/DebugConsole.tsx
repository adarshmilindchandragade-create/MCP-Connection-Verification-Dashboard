import React, { useEffect, useRef, useState } from 'react';
import { useMCPStore } from '../store/mcpStore';
import { Terminal as TermIcon, Trash2 } from 'lucide-react';

interface ConsoleLine {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'system';
  message: string;
}

export const DebugConsole: React.FC = () => {
  const { status } = useMCPStore();
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLine = (type: ConsoleLine['type'], message: string) => {
    setLines(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        type,
        message
      }
    ].slice(-200)); // Keep last 200 lines
  };

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || '';
    // Populate initial system messages
    addLine('system', 'MCP Inspector Console Emulator v1.0.0 initialized');
    addLine('system', `Status: ${status.toUpperCase()}. Awaiting connections...`);
    
    // Connect to SSE log stream
    const eventSource = new EventSource(`${API_BASE_URL}/api/logs/stream`);

    eventSource.onopen = () => {
      addLine('system', 'Connected to backend live logs SSE stream.');
    };

    eventSource.onerror = () => {
      // Bypassed if connection is lost, fall back
    };

    eventSource.onmessage = (event) => {
      try {
        const packet = JSON.parse(event.data);
        if (packet.type === 'timeline') {
          const logType = packet.data.type === 'info' ? 'info' : 
                          packet.data.type === 'success' ? 'success' : 
                          packet.data.type === 'warning' ? 'warn' : 'error';
          addLine(logType, `[Timeline] ${packet.data.message}`);
        } else if (packet.type === 'traffic') {
          const arrow = packet.data.direction === 'request' ? '→' : '←';
          const direction = packet.data.direction === 'request' ? 'REQ' : 'RES';
          const errorMsg = packet.data.error ? ` | Error: ${packet.data.error}` : '';
          const elapsed = packet.data.duration !== undefined ? ` in ${packet.data.duration}ms` : '';
          
          addLine(
            packet.data.error ? 'error' : 'info', 
            `[Traffic] ${arrow} ${direction}: ${packet.data.method}${elapsed}${errorMsg}`
          );
        }
      } catch (err) {}
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Listen to status changes to print to console
  useEffect(() => {
    if (status === 'connected') {
      addLine('success', 'System State Updated: CONNECTED');
    } else if (status === 'disconnected') {
      addLine('warn', 'System State Updated: DISCONNECTED');
    }
  }, [status]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines]);

  const clearConsole = () => {
    setLines([]);
    addLine('system', 'Console history cleared.');
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[350px] font-mono">
      {/* Console Header */}
      <div className="bg-[#09090b] px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-zinc-400">
          <TermIcon className="w-4 h-4 text-emerald-500 animate-pulse-subtle" />
          <span className="text-[11px] font-bold tracking-wider">MCP Live Debug Console</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearConsole}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-900 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal screen */}
      <div className="flex-1 p-4 overflow-y-auto text-[11px] space-y-1.5 scrollbar-thin">
        {lines.map((line) => {
          let color = 'text-zinc-400';
          let prefix = '[INFO]';
          
          if (line.type === 'success') {
            color = 'text-emerald-400';
            prefix = '[OK  ]';
          } else if (line.type === 'warn') {
            color = 'text-amber-400';
            prefix = '[WARN]';
          } else if (line.type === 'error') {
            color = 'text-rose-400';
            prefix = '[ERR ]';
          } else if (line.type === 'system') {
            color = 'text-blue-400';
            prefix = '[SYS ]';
          }

          return (
            <div key={line.id} className="flex items-start space-x-2 leading-relaxed">
              <span className="text-zinc-600 shrink-0">{line.time}</span>
              <span className={`${color} font-bold shrink-0`}>{prefix}</span>
              <span className="text-zinc-300 break-all select-text">{line.message}</span>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Console Footer Prompt */}
      <div className="bg-[#09090b] px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between shrink-0">
        <span className="flex items-center">
          <span className="text-emerald-500 mr-1.5">mcp-inspector:~$</span>
          <span className="animate-pulse">_</span>
        </span>
        <span className="text-[9px] text-zinc-600">SSE active</span>
      </div>
    </div>
  );
};
