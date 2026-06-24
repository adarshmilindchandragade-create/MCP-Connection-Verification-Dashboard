import React, { useEffect } from 'react';
import { useMCPStore } from '../store/mcpStore';
import { Activity, RefreshCw, Loader2, AlertCircle, HelpCircle } from 'lucide-react';

export const Health: React.FC = () => {
  const { validationChecks, n8nTests, runValidation, runN8NTests, status } = useMCPStore();

  const triggerChecks = async () => {
    await runValidation();
    await runN8NTests();
  };

  useEffect(() => {
    // Run diagnostics automatically if connected
    if (status === 'connected') {
      triggerChecks();
    }
  }, [status]);

  const totalChecks = validationChecks.length + n8nTests.length;
  const passedChecks = 
    validationChecks.filter(c => c.status === 'pass').length + 
    n8nTests.filter(t => t.status === 'pass').length;
  
  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
  
  const isRunning = 
    validationChecks.some(c => c.status === 'pending') || 
    n8nTests.some(t => t.status === 'pending');

  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (val >= 50) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  };

  // Troubleshooting suggestions depending on failures
  const troubleshootingGuides = [
    {
      title: '401 Unauthorized / Token Errors',
      problem: 'Authentication token check is failing.',
      solution: 'For the n8n native MCP endpoint (/mcp-server/http), you must use the specific "Instance-level MCP Access Token" generated inside n8n under Settings -> Instance-level MCP. Note that the standard n8n REST API key will result in a 401 Unauthorized error.'
    },
    {
      title: 'Connection Refused / 404 Endpoint Not Found',
      problem: 'Endpoint reachability check or URL check is failing.',
      solution: 'Ensure n8n is running locally or online. The default REST endpoint URL is usually: http://localhost:5678/rest/mcp. If n8n is running on a custom port, make sure to update the URL config port.'
    },
    {
      title: 'MCP Handshake Failed',
      problem: 'Handshake version check fails or times out.',
      solution: 'Verify that both the client and server are using the compatible Model Context Protocol specifications (current SDK: 2025-03-26). If running via stdio, check if the command paths (node, python, npx) are registered in your OS System Environment variables (PATH).'
    },
    {
      title: 'n8n Workflow Execution Errors',
      problem: 'Execute workflow or list workflows checks are failing.',
      solution: 'Make sure your n8n workflows have appropriate trigger settings configured. Ensure you have workflows created and active. If querying credentials, verify that the API user has admin privileges.'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center space-x-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Automated Health Diagnostics</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
            Run automated integration validation tests to evaluate connectivity, schemas, and credentials.
          </p>
        </div>
        <button
          onClick={triggerChecks}
          disabled={isRunning || status !== 'connected'}
          className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-700 text-zinc-200 text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shrink-0 cursor-pointer"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Run Diagnostics</span>
            </>
          )}
        </button>
      </div>

      {status !== 'connected' && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl text-amber-400 text-xs flex items-start space-x-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Connection Offline</span>
            Tests will display in pending/mock mode. Establish an active server connection to retrieve live diagnostics.
          </div>
        </div>
      )}

      {/* Score and Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Score Badge */}
        <div className={`border rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden ${getScoreColor(score)}`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 mb-1">
            Overall Health Index
          </span>
          <div className="text-6xl font-extrabold font-mono tracking-tighter my-2">
            {score}
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-300">
            {score >= 80 ? '✓ Healthy System' : score >= 50 ? '⚠ Warning State' : '✗ Critical Issues'}
          </span>
          <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed max-w-[200px]">
            Passed {passedChecks} out of {totalChecks} checks. Review failures below.
          </p>
        </div>

        {/* Diagnostic Checklist (Left) */}
        <div className="md:col-span-2 space-y-6">
          {/* Connection Checks */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3 mb-4">
              Connection Validator Checklist
            </h2>
            <div className="space-y-3 font-mono text-xs">
              {validationChecks.map(check => (
                <div key={check.id} className="flex items-start justify-between py-1.5 border-b border-zinc-800/40 last:border-b-0">
                  <span className="text-zinc-300 font-sans">{check.name}</span>
                  <div className="flex items-center space-x-2">
                    {check.message && (
                      <span className="text-[10px] text-zinc-500 font-normal mr-2 max-w-[240px] truncate" title={check.message}>
                        ({check.message})
                      </span>
                    )}
                    {check.status === 'pass' ? (
                      <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                        PASS
                      </span>
                    ) : check.status === 'fail' ? (
                      <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                        FAIL
                      </span>
                    ) : (
                      <span className="text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                        PEND
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* n8n Tests */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3 mb-4">
              n8n-Specific Integration Tests
            </h2>
            <div className="space-y-3 font-mono text-xs">
              {n8nTests.map(test => (
                <div key={test.id} className="flex flex-col py-2 border-b border-zinc-800/40 last:border-b-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-sans font-medium">{test.name}</span>
                    <div>
                      {test.status === 'pass' ? (
                        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          PASS
                        </span>
                      ) : test.status === 'fail' ? (
                        <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          FAIL
                        </span>
                      ) : (
                        <span className="text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                          PEND
                        </span>
                      )}
                    </div>
                  </div>
                  {test.details && (
                    <span className="text-[10px] text-zinc-500 leading-relaxed font-sans pl-1 block">
                      ↳ {test.details}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting Guide & Recovery */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-xl">
        <h2 className="text-sm font-semibold text-zinc-200 flex items-center space-x-2 mb-5">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>Error Recovery & Troubleshooting Guide</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {troubleshootingGuides.map((guide, idx) => (
            <div key={idx} className="p-4 bg-[#09090b] border border-zinc-800/80 rounded-lg">
              <span className="text-xs font-semibold text-zinc-200 block mb-1">
                {guide.title}
              </span>
              <span className="text-[10px] text-rose-400 font-mono block mb-2 leading-relaxed">
                Problem: {guide.problem}
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {guide.solution}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
