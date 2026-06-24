export type ConnectionType = 'sse' | 'stdio';

export interface ConnectionConfig {
  type: ConnectionType;
  url: string;
  token?: string;
  command?: string;
  args?: string[];
}

export type MCPStatus = 'connected' | 'disconnected' | 'connecting';

export interface MCPCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
  logging?: boolean;
  sampling?: boolean;
}

export interface HandshakeDetails {
  protocolVersion: string;
  serverName: string;
  serverVersion: string;
  capabilities: MCPCapabilities;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO string or time format
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface TrafficLog {
  id: string;
  timestamp: string;
  direction: 'request' | 'response';
  method: string;
  payload: any;
  duration?: number; // ms
  error?: string;
}

export interface ValidationCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message?: string;
}

export interface N8NTest {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'pending';
  details?: string;
}

export interface DashboardMetrics {
  totalTools: number;
  totalResources: number;
  totalPrompts: number;
  failedRequests: number;
  avgResponseTime: number; // ms
}
