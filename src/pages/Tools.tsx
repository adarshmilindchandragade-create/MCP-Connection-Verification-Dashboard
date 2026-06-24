import React from 'react';
import { ToolRunner } from '../components/ToolRunner';
import { Hammer } from 'lucide-react';

export const Tools: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center space-x-3">
          <Hammer className="w-5 h-5 text-indigo-400" />
          <span>Interactive Tool Explorer</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
          Inspect schemas, input mock params or execute real API calls directly on your connected MCP daemon.
        </p>
      </div>

      {/* Runner */}
      <ToolRunner />
    </div>
  );
};
