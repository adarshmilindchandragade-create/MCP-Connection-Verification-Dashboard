import React, { useState, useEffect } from 'react';
import { useMCPStore } from '../store/mcpStore';
import { Play, Loader2, Code, FileCode, CheckCircle, AlertTriangle } from 'lucide-react';

export const ToolRunner: React.FC = () => {
  const { tools, executeTool, status } = useMCPStore();
  const [selectedToolName, setSelectedToolName] = useState<string>('');
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);

  const selectedTool = tools.find(t => t.name === selectedToolName);

  // Reset inputs when tool changes
  useEffect(() => {
    if (selectedTool) {
      const initialInputs: Record<string, any> = {};
      const props = selectedTool.inputSchema?.properties || {};
      Object.keys(props).forEach(key => {
        const prop = props[key];
        if (prop.type === 'boolean') {
          initialInputs[key] = false;
        } else if (prop.type === 'object' || prop.type === 'array') {
          initialInputs[key] = '{}';
        } else {
          initialInputs[key] = '';
        }
      });
      setInputs(initialInputs);
      setResult(null);
      setError(null);
      setExecTime(null);
    }
  }, [selectedToolName]);

  // Set default tool if available
  useEffect(() => {
    if (tools.length > 0 && !selectedToolName) {
      setSelectedToolName(tools[0].name);
    }
  }, [tools]);

  const handleInputChange = (key: string, val: any) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  };

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setExecTime(null);

    const parsedArgs: Record<string, any> = {};
    const props = selectedTool.inputSchema?.properties || {};
    let hasParseError = false;

    // Parse and validate arguments
    Object.keys(inputs).forEach(key => {
      const prop = props[key];
      const val = inputs[key];
      
      if (prop.type === 'object' || prop.type === 'array') {
        try {
          parsedArgs[key] = typeof val === 'string' && val.trim() !== '' ? JSON.parse(val) : {};
        } catch (e: any) {
          setError(`Invalid JSON in field "${key}": ${e.message}`);
          hasParseError = true;
        }
      } else if (prop.type === 'boolean') {
        parsedArgs[key] = !!val;
      } else if (prop.type === 'number' || prop.type === 'integer') {
        parsedArgs[key] = val !== '' ? Number(val) : undefined;
      } else {
        parsedArgs[key] = val === '' ? undefined : val;
      }
    });

    if (hasParseError) {
      setLoading(false);
      return;
    }

    const startTime = Date.now();
    try {
      const res = await executeTool(selectedTool.name, parsedArgs);
      setResult(res);
      setExecTime(Date.now() - startTime);
    } catch (err: any) {
      setError(err.message || 'Tool execution failed');
      setExecTime(Date.now() - startTime);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill fields for standard n8n-mcp test workflow execution
  const fillN8NTestParams = () => {
    if (selectedToolName === 'search_workflows') {
      setInputs({ query: 'sync', tag: '' });
    } else if (selectedToolName === 'execute_workflow') {
      setInputs({ workflowId: 'wf_1', arguments: '{"testMode": true}' });
    } else if (selectedToolName === 'get_execution') {
      setInputs({ executionId: 'exec_5902' });
    } else if (selectedToolName === 'list_credentials') {
      setInputs({ type: 'slack' });
    }
  };

  const isConnected = status === 'connected';

  // Helper to colorize response JSON
  const syntaxHighlight = (json: any): string => {
    if (!json) return '';
    let str = JSON.stringify(json, null, 2);
    str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
      let cls = 'text-amber-500';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-emerald-400 font-semibold';
        } else {
          cls = 'text-blue-300';
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-400';
      } else if (/null/.test(match)) {
        cls = 'text-zinc-500';
      }
      return `<span class="${cls}">${match}</span>`;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Pane: Config & Form */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center space-x-2.5 mb-5">
            <Code className="w-4.5 h-4.5 text-indigo-400" />
            <span>Interactive Tool Runner</span>
          </h2>

          {!isConnected ? (
            <div className="p-8 text-center bg-[#09090b] rounded-lg border border-dashed border-[#27272a] my-2">
              <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-xs font-mono text-zinc-400">Server disconnected.</p>
              <p className="text-[10px] text-zinc-600 mt-1">Please connect to a live or mock server to fetch tools and execute calls.</p>
            </div>
          ) : tools.length === 0 ? (
            <div className="p-8 text-center bg-[#09090b] rounded-lg border border-dashed border-[#27272a] my-2">
              <AlertTriangle className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
              <p className="text-xs font-mono text-zinc-400">No tools discovered.</p>
              <p className="text-[10px] text-zinc-600 mt-1">The connected server did not report any available tools.</p>
            </div>
          ) : (
            <form onSubmit={handleRun} className="space-y-5">
              {/* Select Tool Dropdown */}
              <div>
                <label className="block text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                  Select Tool to Execute
                </label>
                <select
                  value={selectedToolName}
                  onChange={(e) => setSelectedToolName(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                >
                  {tools.map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Tool Description */}
              {selectedTool && (
                <div className="p-3 bg-[#09090b] border border-zinc-800/80 rounded-lg text-xs leading-relaxed">
                  <p className="text-zinc-300">{selectedTool.description}</p>
                  
                  {/* Preset Helper for n8n-mcp */}
                  {['search_workflows', 'execute_workflow', 'get_execution', 'list_credentials'].includes(selectedTool.name) && (
                    <button
                      type="button"
                      onClick={fillN8NTestParams}
                      className="mt-2 text-[10px] text-indigo-400 font-mono font-medium hover:text-indigo-300 underline block cursor-pointer"
                    >
                      Prefill n8n verification arguments
                    </button>
                  )}
                </div>
              )}

              {/* Dynamic inputs */}
              {selectedTool && selectedTool.inputSchema?.properties && (
                <div className="space-y-4 border-t border-zinc-800/60 pt-4">
                  <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                    Input Parameters (Schema Defined)
                  </span>

                  {Object.keys(selectedTool.inputSchema.properties).map(key => {
                    const prop = selectedTool.inputSchema.properties![key];
                    const isRequired = selectedTool.inputSchema.required?.includes(key);
                    
                    return (
                      <div key={key} className="space-y-1">
                        <label className="flex items-center justify-between text-xs">
                          <span className="font-mono font-semibold text-zinc-300">
                            {key} {isRequired && <span className="text-rose-500 text-xs">*</span>}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {prop.type || 'string'}
                          </span>
                        </label>
                        
                        {prop.description && (
                          <span className="text-[10px] text-zinc-500 block leading-tight">
                            {prop.description}
                          </span>
                        )}

                        {prop.type === 'boolean' ? (
                          <input
                            type="checkbox"
                            checked={!!inputs[key]}
                            onChange={(e) => handleInputChange(key, e.target.checked)}
                            className="bg-[#09090b] border border-[#27272a] rounded focus:ring-0 text-indigo-500"
                          />
                        ) : prop.type === 'object' || prop.type === 'array' ? (
                          <textarea
                            rows={3}
                            value={inputs[key] || ''}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            placeholder="Enter JSON e.g. { 'foo': 'bar' }"
                            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-indigo-500/50"
                          />
                        ) : (
                          <input
                            type={prop.type === 'number' || prop.type === 'integer' ? 'number' : 'text'}
                            value={inputs[key] || ''}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            placeholder={`Enter ${key}`}
                            required={isRequired}
                            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50 font-mono"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Execution Trigger */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-xs transition-all duration-200 flex items-center justify-center space-x-2 shadow-[0_4px_12px_rgba(79,70,229,0.15)] disabled:opacity-50 hover:shadow-[0_4px_16px_rgba(79,70,229,0.25)] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Running MCP Test Tool Call...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run MCP Test Tool Call</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Pane: Results */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-xl flex flex-col justify-between h-full min-h-[400px]">
        <div className="flex-1 flex flex-col overflow-hidden">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center space-x-2.5 mb-4 shrink-0">
            <FileCode className="w-4.5 h-4.5 text-emerald-400" />
            <span>Execution Raw Response JSON</span>
          </h2>

          <div className="flex-1 bg-[#09090b] border border-zinc-800 rounded-lg p-4 overflow-y-auto font-mono text-xs relative select-text">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090b]/80 space-y-3">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                <span className="text-[10px] text-zinc-500 font-mono">Awaiting response from MCP daemon...</span>
              </div>
            ) : error ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-rose-500 font-semibold mb-1">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Execution Failure (Error Status)</span>
                </div>
                <pre className="text-rose-400 whitespace-pre-wrap font-sans text-xs bg-rose-950/20 border border-rose-500/10 p-3.5 rounded-lg leading-relaxed">
                  {error}
                </pre>
                {execTime !== null && (
                  <span className="text-[10px] text-zinc-500 block pt-1">
                    Total roundtrip latency: <strong className="text-zinc-400">{execTime}ms</strong>
                  </span>
                )}
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-800 pb-2">
                  <span className="flex items-center text-emerald-400 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    STATUS: 200 OK
                  </span>
                  <span>
                    LATENCY: <strong className="text-zinc-300">{execTime}ms</strong>
                  </span>
                </div>
                <pre
                  className="overflow-x-auto text-[11px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: syntaxHighlight(result) }}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-zinc-600">
                <FileCode className="w-8 h-8 text-zinc-700 mb-2" />
                <span className="text-xs">No execution active.</span>
                <span className="text-[10px] max-w-[200px] mt-1 leading-relaxed text-zinc-500">
                  Select a tool, adjust parameters, and click "Run MCP Test Tool Call" to execute.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
