import { create } from 'zustand';
import type { 
  ConnectionConfig, 
  MCPStatus, 
  HandshakeDetails, 
  MCPTool, 
  MCPResource, 
  MCPPrompt, 
  TimelineEvent, 
  TrafficLog, 
  ValidationCheck, 
  N8NTest,
  DashboardMetrics
} from '../types/mcp';

interface MCPStore {
  config: ConnectionConfig;
  status: MCPStatus;
  handshake: HandshakeDetails | null;
  latency: number | null;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  timeline: TimelineEvent[];
  trafficLogs: TrafficLog[];
  validationChecks: ValidationCheck[];
  n8nTests: N8NTest[];
  metrics: DashboardMetrics;
  errorMsg: string | null;
  isMockMode: boolean;

  setConfig: (config: Partial<ConnectionConfig>) => void;
  addTimelineEvent: (type: TimelineEvent['type'], message: string) => void;
  addTrafficLog: (direction: 'request' | 'response', method: string, payload: any, duration?: number, error?: string) => void;
  clearTrafficLogs: () => void;
  setMockMode: (isMock: boolean) => void;
  
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  executeTool: (name: string, args: any) => Promise<any>;
  runValidation: () => Promise<void>;
  runN8NTests: () => Promise<void>;
}

const defaultValidationChecks: ValidationCheck[] = [
  { id: '1', name: 'serverURL configuration check', status: 'pending' },
  { id: '2', name: 'URL syntax validation', status: 'pending' },
  { id: '3', name: 'Endpoint reachability check', status: 'pending' },
  { id: '4', name: 'Authentication token check', status: 'pending' },
  { id: '5', name: 'MCP Handshake protocol check', status: 'pending' },
  { id: '6', name: 'Tools discovery endpoint check', status: 'pending' },
  { id: '7', name: 'Resources discovery endpoint check', status: 'pending' },
];

const defaultN8NTests: N8NTest[] = [
  { id: 'n1', name: 'List Workflows API Call', status: 'pending' },
  { id: 'n2', name: 'Get Specific Workflow Details', status: 'pending' },
  { id: 'n3', name: 'Execute Active Workflow Trigger', status: 'pending' },
  { id: 'n4', name: 'Verify Credentials Retrieval', status: 'pending' }
];

const parseResponseJson = async (res: Response): Promise<any> => {
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch (e: any) {
      const text = await res.text();
      throw new Error(`Failed to parse JSON response. Raw output:\n${text.slice(0, 500)}`);
    }
  } else {
    const text = await res.text();
    if (text.includes('<!doctype html>') || text.includes('<html')) {
      const titleMatch = text.match(/<title>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'HTML page';
      throw new Error(`Server returned HTML ("${title}") instead of JSON. This usually indicates an incorrect endpoint URL. (Status code: ${res.status})`);
    }
    throw new Error(`Server returned non-JSON response (Status code: ${res.status}):\n${text.slice(0, 500)}`);
  }
};

export const useMCPStore = create<MCPStore>((set, get) => ({
  config: {
    type: 'sse',
    url: 'http://localhost:5678/mcp-server/http',
    token: '',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-everything']
  },
  status: 'disconnected',
  handshake: null,
  latency: null,
  tools: [],
  resources: [],
  prompts: [],
  timeline: [],
  trafficLogs: [],
  validationChecks: defaultValidationChecks,
  n8nTests: defaultN8NTests,
  metrics: {
    totalTools: 0,
    totalResources: 0,
    totalPrompts: 0,
    failedRequests: 0,
    avgResponseTime: 0
  },
  errorMsg: null,
  isMockMode: false,

  setConfig: (newConfig) => set((state) => ({ 
    config: { ...state.config, ...newConfig } 
  })),

  addTimelineEvent: (type, message) => set((state) => {
    const newEvent: TimelineEvent = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    return { timeline: [...state.timeline, newEvent] };
  }),

  addTrafficLog: (direction, method, payload, duration, error) => set((state) => {
    const log: TrafficLog = {
      id: Math.random().toString(),
      timestamp: new Date().toISOString(),
      direction,
      method,
      payload,
      duration,
      error
    };
    const updatedLogs = [log, ...state.trafficLogs].slice(0, 100);
    
    // Update response metrics
    let newFailedRequests = state.metrics.failedRequests;
    if (direction === 'response' && error) {
      newFailedRequests += 1;
    }
    
    let newAvgResponseTime = state.metrics.avgResponseTime;
    if (direction === 'response' && duration !== undefined) {
      const responseLogs = updatedLogs.filter(l => l.direction === 'response' && l.duration !== undefined);
      const totalDurations = responseLogs.reduce((acc, curr) => acc + (curr.duration || 0), 0);
      newAvgResponseTime = Math.round(totalDurations / (responseLogs.length || 1));
    }

    return { 
      trafficLogs: updatedLogs,
      metrics: {
        ...state.metrics,
        failedRequests: newFailedRequests,
        avgResponseTime: newAvgResponseTime
      }
    };
  }),

  clearTrafficLogs: () => set({ trafficLogs: [] }),

  setMockMode: (isMock) => set({ isMockMode: isMock }),

  connect: async () => {
    const { config, addTimelineEvent, addTrafficLog } = get();
    set({ status: 'connecting', errorMsg: null });
    addTimelineEvent('info', `Initiated connection (${config.type.toUpperCase()})`);
    
    const startTime = Date.now();
    const reqMethod = 'initialize';
    
    addTrafficLog('request', reqMethod, { config });

    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, mock: get().isMockMode })
      });
      
      const duration = Date.now() - startTime;
      const data = await parseResponseJson(res);
      
      if (!res.ok) {
        throw new Error(data.message || `Server responded with ${res.status}`);
      }

      addTrafficLog('response', reqMethod, data, duration);
      addTimelineEvent('success', 'Handshake completed successfully');
      addTimelineEvent('success', `Connected to: ${data.handshake.serverName} v${data.handshake.serverVersion}`);
      addTimelineEvent('info', `Discovered ${data.tools?.length || 0} tools, ${data.resources?.length || 0} resources, and ${data.prompts?.length || 0} prompts`);

      set({
        status: 'connected',
        latency: duration,
        handshake: data.handshake,
        tools: data.tools || [],
        resources: data.resources || [],
        prompts: data.prompts || [],
        errorMsg: null,
        metrics: {
          totalTools: data.tools?.length || 0,
          totalResources: data.resources?.length || 0,
          totalPrompts: data.prompts?.length || 0,
          failedRequests: get().metrics.failedRequests,
          avgResponseTime: get().metrics.avgResponseTime
        }
      });
      
      // Instantly run validation list to keep checker fresh
      get().runValidation();

      return true;
    } catch (err: any) {
      const duration = Date.now() - startTime;
      const errMsg = err.message || 'Connection refused or timeout';
      
      addTrafficLog('response', reqMethod, null, duration, errMsg);
      addTimelineEvent('error', `Connection Failed: ${errMsg}`);
      
      set({ 
        status: 'disconnected', 
        latency: null,
        handshake: null,
        errorMsg: errMsg,
        // Mark checks as fail
        validationChecks: get().validationChecks.map(c => ({
          ...c,
          status: 'fail',
          message: c.id === '1' || c.id === '2' ? 'pass' : errMsg
        }))
      });
      return false;
    }
  },

  disconnect: async () => {
    const { addTimelineEvent } = get();
    try {
      await fetch('/api/disconnect', { method: 'POST' });
    } catch (e) {}

    addTimelineEvent('info', 'Disconnected from server');
    set({
      status: 'disconnected',
      handshake: null,
      latency: null,
      tools: [],
      resources: [],
      prompts: [],
      validationChecks: defaultValidationChecks,
      n8nTests: defaultN8NTests,
      errorMsg: null
    });
  },

  executeTool: async (name, args) => {
    const { addTimelineEvent, addTrafficLog } = get();
    addTimelineEvent('info', `Executing tool: ${name}`);
    
    const startTime = Date.now();
    addTrafficLog('request', `tools/call (${name})`, { name, arguments: args });

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, arguments: args, mock: get().isMockMode })
      });
      
      const duration = Date.now() - startTime;
      const data = await parseResponseJson(res);
      
      if (!res.ok) {
        throw new Error(data.message || `Execution failed with status ${res.status}`);
      }

      addTrafficLog('response', `tools/call (${name})`, data, duration);
      addTimelineEvent('success', `Tool ${name} executed in ${duration}ms`);
      return data;
    } catch (err: any) {
      const duration = Date.now() - startTime;
      const errMsg = err.message || 'Execution failed';
      
      addTrafficLog('response', `tools/call (${name})`, null, duration, errMsg);
      addTimelineEvent('error', `Tool execution failed: ${errMsg}`);
      throw err;
    }
  },

  runValidation: async () => {
    const { config, addTimelineEvent } = get();
    set(state => ({
      validationChecks: state.validationChecks.map(c => ({ ...c, status: 'pending', message: undefined }))
    }));

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, mock: get().isMockMode })
      });
      
      const data = await parseResponseJson(res);
      if (res.ok && data.checks) {
        set({ validationChecks: data.checks });
      } else {
        throw new Error(data.message || 'Validation failed');
      }
    } catch (err: any) {
      addTimelineEvent('warning', `Validation Check failed: ${err.message}`);
      set(state => ({
        validationChecks: state.validationChecks.map(c => ({
          ...c,
          status: 'fail',
          message: err.message || 'Failed to contact validation API'
        }))
      }));
    }
  },

  runN8NTests: async () => {
    const { addTimelineEvent, config } = get();
    set(state => ({
      n8nTests: state.n8nTests.map(t => ({ ...t, status: 'pending', details: undefined }))
    }));

    try {
      const res = await fetch('/api/health/n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, mock: get().isMockMode })
      });
      
      const data = await parseResponseJson(res);
      if (res.ok && data.tests) {
        set({ n8nTests: data.tests });
        addTimelineEvent('info', 'n8n integration verification tests completed');
      } else {
        throw new Error(data.message || 'n8n testing failed');
      }
    } catch (err: any) {
      addTimelineEvent('error', `n8n integration test failed: ${err.message}`);
      set(state => ({
        n8nTests: state.n8nTests.map(t => ({
          ...t,
          status: 'fail',
          details: err.message || 'Failed to complete n8n checks'
        }))
      }));
    }
  }
}));
