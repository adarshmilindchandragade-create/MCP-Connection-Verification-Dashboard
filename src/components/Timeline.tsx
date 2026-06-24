import React from 'react';
import type { TimelineEvent } from '../types/mcp';
import { Circle, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center bg-[#09090b] rounded-lg border border-dashed border-[#27272a] h-full min-h-[220px]">
        <Clock className="w-6 h-6 text-zinc-600 mb-2" />
        <p className="text-xs text-zinc-500 font-mono">No connection events recorded</p>
      </div>
    );
  }

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-xl h-full flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>MCP Connection Timeline</span>
        </h3>
        
        <div className="relative border-l border-zinc-800 ml-3 pl-6 space-y-5 py-1">
          {events.map((event, idx) => {
            let Icon = Circle;
            let colorClass = 'text-zinc-500 bg-zinc-900 border-zinc-800';
            
            if (event.type === 'success') {
              Icon = CheckCircle2;
              colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
            } else if (event.type === 'warning') {
              Icon = AlertTriangle;
              colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/25';
            } else if (event.type === 'error') {
              Icon = XCircle;
              colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/25';
            }

            return (
              <div key={event.id || idx} className="relative group">
                {/* Bullet */}
                <div className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                </div>
                
                {/* Content */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono font-medium">{event.timestamp}</span>
                    <span className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded ${
                      event.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                      event.type === 'error' ? 'bg-rose-500/10 text-rose-400' :
                      event.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 font-sans mt-1 leading-relaxed">
                    {event.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
