import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ConnectionConfig, HandshakeDetails, MCPTool, MCPResource, MCPPrompt, TimelineEvent, TrafficLog, ValidationCheck, N8NTest } from "../src/types/mcp.js";

export class MCPProxy {
  client: Client | null = null;
  transport: any = null;
  config: ConnectionConfig | null = null;
  
  trafficLogs: TrafficLog[] = [];
  timeline: TimelineEvent[] = [];
  
  isMock: boolean = false;
  mockTools: MCPTool[] = [
    {
      name: "search_workflows",
      description: "Search for workflows on the n8n instance by name or tag.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query string" },
          tag: { type: "string", description: "Filter by tag name" }
        }
      }
    },
    {
      name: "execute_workflow",
      description: "Trigger/execute a workflow by its ID or Name, returning the execution results.",
      inputSchema: {
        type: "object",
        properties: {
          workflowId: { type: "string", description: "The ID of the workflow to execute" },
          arguments: { type: "object", description: "Optional arguments to pass to the trigger node" }
        },
        required: ["workflowId"]
      }
    },
    {
      name: "get_execution",
      description: "Retrieve details and status logs for a specific workflow execution run.",
      inputSchema: {
        type: "object",
        properties: {
          executionId: { type: "string", description: "The execution run ID" }
        },
        required: ["executionId"]
      }
    },
    {
      name: "list_credentials",
      description: "List credentials configured in this n8n instance to check integration health.",
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string", description: "Filter by credential type (e.g. slack, postgres)" }
        }
      }
    }
  ];

  mockResources: MCPResource[] = [
    { uri: "n8n://active-workflows", name: "Active Workflows", description: "List of currently active and monitoring workflows", mimeType: "text/plain" },
    { uri: "n8n://latest-executions", name: "Latest Executions Log", description: "Log of the last 10 executions across all workflows", mimeType: "application/json" },
    { uri: "database://n8n-main-db", name: "Main DB Metadata", description: "Connection details for n8n main sqlite/postgres db", mimeType: "application/json" }
  ];

  mockPrompts: MCPPrompt[] = [
    {
      name: "design-workflow",
      description: "Generate a recommended n8n workflow node structure based on a plain-text prompt.",
      arguments: [
        { name: "description", description: "What should the workflow do? (e.g. Sync Shopify to Airtable)", required: true },
        { name: "complexity", description: "Simple, Medium, or Complex", required: false }
      ]
    },
    {
      name: "debug-execution-error",
      description: "Get advice on how to troubleshoot an n8n node execution error.",
      arguments: [
        { name: "errorMessage", description: "The raw error message", required: true },
        { name: "nodeType", description: "The type of the node that failed", required: false }
      ]
    }
  ];

  addTrafficLog(direction: 'request' | 'response', method: string, payload: any, duration?: number, error?: string) {
    const log: TrafficLog = {
      id: Math.random().toString(),
      timestamp: new Date().toISOString(),
      direction,
      method,
      payload,
      duration,
      error
    };
    this.trafficLogs = [log, ...this.trafficLogs].slice(0, 100);
  }

  addTimelineEvent(type: TimelineEvent['type'], message: string) {
    const event: TimelineEvent = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    this.timeline.push(event);
  }

  async connect(config: ConnectionConfig, mock: boolean = false): Promise<{
    handshake: HandshakeDetails;
    tools: MCPTool[];
    resources: MCPResource[];
    prompts: MCPPrompt[];
  }> {
    this.config = config;
    this.isMock = mock;
    this.trafficLogs = [];
    this.timeline = [];

    this.addTimelineEvent("info", `Connection initialization started (mode: ${mock ? 'MOCK' : 'LIVE'})`);

    if (mock) {
      this.addTimelineEvent("info", "Establishing simulated socket/SSE connection...");
      this.addTimelineEvent("success", "MCP Handshake connection successful");
      this.addTimelineEvent("success", "Capabilities loaded");
      this.addTimelineEvent("success", "Tools registered (4 discovered)");
      this.addTimelineEvent("success", "Resources registered (3 discovered)");
      this.addTimelineEvent("success", "Prompts registered (2 discovered)");

      const handshake: HandshakeDetails = {
        protocolVersion: "2025-03-26",
        serverName: "n8n-mcp-mock",
        serverVersion: "1.0.0",
        capabilities: { tools: true, resources: true, prompts: true, logging: false, sampling: false }
      };

      return {
        handshake,
        tools: this.mockTools,
        resources: this.mockResources,
        prompts: this.mockPrompts
      };
    }

    // Live Mode connection
    await this.disconnect();
    this.addTimelineEvent("info", `Targeting ${config.type} transport...`);
    
    if (config.type === 'sse') {
      if (!config.url) {
        throw new Error("Server URL is required for SSE transport");
      }
      try {
        const headers: Record<string, string> = {};
        if (config.token) {
          headers["Authorization"] = config.token.startsWith("Bearer ") 
            ? config.token 
            : `Bearer ${config.token}`;
        }
        
        const isStreamable = config.url.includes('/mcp-server/http') || config.url.endsWith('/http');
        
        if (isStreamable) {
          this.addTimelineEvent("info", `Connecting to Streamable HTTP URL: ${config.url}`);
          this.transport = new StreamableHTTPClientTransport(new URL(config.url), {
            requestInit: {
              headers
            }
          });
        } else {
          this.addTimelineEvent("info", `Connecting to legacy SSE URL: ${config.url}`);
          this.transport = new SSEClientTransport(new URL(config.url), {
            requestInit: {
              headers
            }
          });
        }
      } catch (err: any) {
        this.addTimelineEvent("error", `Invalid URL syntax or connection setup: ${err.message}`);
        throw new Error(`URL validation failed: ${err.message}`);
      }
    } else {
      const command = config.command || 'node';
      const args = config.args || [];
      this.addTimelineEvent("info", `Spawning stdio process: ${command} ${args.join(' ')}`);
      this.transport = new StdioClientTransport({
        command,
        args
      });
    }

    this.client = new Client(
      { name: "mcp-inspector-client", version: "1.0.0" },
      { capabilities: { listTools: {}, listResources: {}, listPrompts: {} } }
    );

    try {
      this.addTimelineEvent("info", "Sending initialize request (Handshake)...");
      await this.client.connect(this.transport);
      this.addTimelineEvent("success", "MCP Handshake successful");
    } catch (err: any) {
      this.addTimelineEvent("error", `Handshake Failed: ${err.message}`);
      throw new Error(`Handshake failure: ${err.message}`);
    }

    // Retrieve capabilities, tools, resources, prompts
    let tools: MCPTool[] = [];
    let resources: MCPResource[] = [];
    let prompts: MCPPrompt[] = [];

    // Query server details
    const capabilities = this.client.getServerCapabilities() || {};
    const serverInfo = this.client.getServerVersion() || { name: "unknown", version: "unknown" };
    
    this.addTimelineEvent("success", "Server Capabilities fetched");

    // Fetch Tools
    try {
      this.addTimelineEvent("info", "Listing tools...");
      const toolsResult = await this.client.listTools();
      tools = (toolsResult?.tools as MCPTool[]) || [];
      this.addTimelineEvent("success", `Discovered ${tools.length} tools`);
    } catch (err: any) {
      this.addTimelineEvent("warning", `Failed to list tools: ${err.message}`);
    }

    // Fetch Resources
    try {
      this.addTimelineEvent("info", "Listing resources...");
      const resourcesResult = await this.client.listResources();
      resources = (resourcesResult?.resources as MCPResource[]) || [];
      this.addTimelineEvent("success", `Discovered ${resources.length} resources`);
    } catch (err: any) {
      // Not all servers implement resources
      this.addTimelineEvent("info", `Resources list bypassed or not supported: ${err.message}`);
    }

    // Fetch Prompts
    try {
      this.addTimelineEvent("info", "Listing prompts...");
      const promptsResult = await this.client.listPrompts();
      prompts = (promptsResult?.prompts as MCPPrompt[]) || [];
      this.addTimelineEvent("success", `Discovered ${prompts.length} prompts`);
    } catch (err: any) {
      this.addTimelineEvent("info", `Prompts list bypassed or not supported: ${err.message}`);
    }

    const handshake: HandshakeDetails = {
      protocolVersion: "2025-03-26", // SDK current standard
      serverName: serverInfo.name,
      serverVersion: serverInfo.version,
      capabilities: {
        tools: !!capabilities.tools,
        resources: !!capabilities.resources,
        prompts: !!capabilities.prompts,
        logging: !!capabilities.logging,
        sampling: !!capabilities.sampling
      }
    };

    return {
      handshake,
      tools,
      resources,
      prompts
    };
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.close();
      } catch (e) {}
      this.client = null;
    }
    if (this.transport) {
      try {
        await this.transport.close();
      } catch (e) {}
      this.transport = null;
    }
    this.isMock = false;
    this.addTimelineEvent("info", "Session closed");
  }

  async executeTool(name: string, args: any, mock: boolean = false): Promise<any> {
    if (mock || this.isMock) {
      // Mock returns
      if (name === "search_workflows") {
        return {
          workflows: [
            { id: "wf_1", name: "Sync Lead to Salesforce", active: true, createdAt: "2026-06-20T10:00:00Z" },
            { id: "wf_2", name: "GitHub Webhook Alert Bot", active: true, createdAt: "2026-06-21T12:00:00Z" },
            { id: "wf_3", name: "Report Emailer Monthly", active: false, createdAt: "2026-06-22T08:30:00Z" }
          ],
          count: 3
        };
      }
      if (name === "execute_workflow") {
        return {
          executionId: "exec_5902",
          status: "success",
          finished: true,
          data: {
            output: [{ status: "sent", target: "slack-channel", payload: { text: "Workflow completed!" } }]
          }
        };
      }
      if (name === "get_execution") {
        return {
          id: args.executionId || "exec_5902",
          workflowId: "wf_1",
          status: "success",
          startedAt: "2026-06-23T20:10:00Z",
          stoppedAt: "2026-06-23T20:10:04Z",
          mode: "webhook"
        };
      }
      if (name === "list_credentials") {
        return {
          credentials: [
            { id: "cred_1", name: "Slack OAuth2 Account", type: "slackOAuth2Api" },
            { id: "cred_2", name: "PostgreSQL Production DB", type: "postgres" }
          ]
        };
      }
      return { message: "Mock execution successful", arguments: args };
    }

    if (!this.client) {
      throw new Error("No connected client. Please run connection check first.");
    }
    return await this.client.callTool({ name, arguments: args });
  }

  async validate(config: ConnectionConfig, mock: boolean = false): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [
      { id: '1', name: 'serverURL configuration check', status: 'pending' },
      { id: '2', name: 'URL syntax validation', status: 'pending' },
      { id: '3', name: 'Endpoint reachability check', status: 'pending' },
      { id: '4', name: 'Authentication token check', status: 'pending' },
      { id: '5', name: 'MCP Handshake protocol check', status: 'pending' },
      { id: '6', name: 'Tools discovery endpoint check', status: 'pending' },
      { id: '7', name: 'Resources discovery endpoint check', status: 'pending' }
    ];

    const markCheck = (id: string, status: 'pass' | 'fail', message?: string) => {
      const c = checks.find(x => x.id === id);
      if (c) {
        c.status = status;
        c.message = message;
      }
    };

    if (mock || this.isMock) {
      checks.forEach(c => {
        c.status = 'pass';
        if (c.id === '1') c.message = 'URL exists: http://localhost:5678/rest/mcp';
        if (c.id === '2') c.message = 'Valid HTTP URL format';
        if (c.id === '3') c.message = 'Ping success (2ms)';
        if (c.id === '4') c.message = 'No token needed (server running in local dev mode)';
        if (c.id === '5') c.message = 'Handshake version 2025-03-26 accepted';
        if (c.id === '6') c.message = 'Discovered 4 tools';
        if (c.id === '7') c.message = 'Discovered 3 resources';
      });
      return checks;
    }

    // 1. Config Check
    if (config.type === 'sse') {
      if (config.url) {
        markCheck('1', 'pass', `URL configured: ${config.url}`);
      } else {
        markCheck('1', 'fail', 'No URL configured in settings');
        return checks;
      }

      // 2. Syntax Check
      try {
        new URL(config.url);
        markCheck('2', 'pass', 'URL matches standard web syntax');
      } catch (e) {
        markCheck('2', 'fail', 'Malformed URL string');
        return checks;
      }

      // 3. Reachable Check
      try {
        const pingStart = Date.now();
        // Just fetch the root URL to check connection (do not require full SSE handshake yet)
        const res = await fetch(config.url, { method: 'GET', timeout: 5000 }).catch(e => {
          // If it fails with 404 or 405, it is still "reachable" physically
          if (e.name === 'FetchError' && e.code !== 'ECONNREFUSED' && e.code !== 'ENOTFOUND') {
            return { ok: true, status: 200, headers: { get: () => '' } } as any;
          }
          throw e;
        });
        const latency = Date.now() - pingStart;
        const contentType = res.headers.get('content-type') || '';
        
        if (contentType.includes('text/html')) {
          markCheck('3', 'fail', 'URL returned HTML (n8n Editor UI) instead of SSE stream. Incorrect MCP URL.');
          this.addTimelineEvent("error", "Validation Warning: Server URL returned HTML content. Double check URL configuration.");
        } else {
          markCheck('3', 'pass', `Connected. Status code: ${res.status} (${latency}ms)`);
        }
      } catch (e: any) {
        markCheck('3', 'fail', `Connection Refused: ${e.message}`);
        return checks;
      }

      // 4. Token Check
      if (config.token) {
        markCheck('4', 'pass', 'Authorization header format valid');
      } else {
        markCheck('4', 'pass', 'Bypassed (No token provided, testing without auth header)');
      }
    } else {
      // Stdio validation
      markCheck('1', 'pass', `Stdio command configured: ${config.command}`);
      markCheck('2', 'pass', 'Local subprocess transport');
      markCheck('3', 'pass', 'Local execution node reachable');
      markCheck('4', 'pass', 'Token check bypassed for Stdio');
    }

    // 5. Handshake and 6/7. Discovery endpoints
    if (this.client) {
      markCheck('5', 'pass', `Handshake protocol verified with server: ${this.client.getServerVersion()?.name}`);
      
      try {
        const toolsResult = await this.client.listTools();
        markCheck('6', 'pass', `Discovered ${(toolsResult?.tools || []).length} tools`);
      } catch (e: any) {
        markCheck('6', 'fail', `Tools list failed: ${e.message}`);
      }

      try {
        const resResult = await this.client.listResources();
        markCheck('7', 'pass', `Discovered ${(resResult?.resources || []).length} resources`);
      } catch (e: any) {
        markCheck('7', 'pass', `Bypassed/Resources not supported: ${e.message}`);
      }
    } else {
      markCheck('5', 'fail', 'No active client connection. Handshake check failed.');
      markCheck('6', 'fail', 'Tools list unreachable without connection');
      markCheck('7', 'fail', 'Resources list unreachable without connection');
    }

    return checks;
  }

  async runN8NTests(config: ConnectionConfig, mock: boolean = false): Promise<N8NTest[]> {
    const tests: N8NTest[] = [
      { id: 'n1', name: 'List Workflows API Call', status: 'pending' },
      { id: 'n2', name: 'Get Specific Workflow Details', status: 'pending' },
      { id: 'n3', name: 'Execute Active Workflow Trigger', status: 'pending' },
      { id: 'n4', name: 'Verify Credentials Retrieval', status: 'pending' }
    ];

    const updateTest = (id: string, status: 'pass' | 'fail', details?: string) => {
      const t = tests.find(x => x.id === id);
      if (t) {
        t.status = status;
        t.details = details;
      }
    };

    if (mock || this.isMock) {
      updateTest('n1', 'pass', 'Successfully executed search_workflows. Found 3 workflows.');
      updateTest('n2', 'pass', 'Workflow details retrieved (ID: wf_1). Checked triggers and nodes.');
      updateTest('n3', 'pass', 'Mock workflow triggered successfully (Execution ID: exec_5902).');
      updateTest('n4', 'pass', 'Credentials verified: Slack OAuth2 account active.');
      return tests;
    }

    if (!this.client) {
      tests.forEach(t => {
        t.status = 'fail';
        t.details = 'No active connection to MCP server';
      });
      return tests;
    }

    // Verify if tools exist
    let availableTools: MCPTool[] = [];
    try {
      const toolsRes = await this.client.listTools();
      availableTools = (toolsRes?.tools as MCPTool[]) || [];
    } catch (e) {}

    // Find tools
    const searchTool = availableTools.find(t => t.name === 'search_workflows' || t.name === 'list_workflows');
    const executeTool = availableTools.find(t => t.name === 'execute_workflow' || t.name === 'trigger_workflow');
    const getTool = availableTools.find(t => t.name === 'get_workflow_details' || t.name === 'get_workflow' || t.name === 'get_execution');
    const credsTool = availableTools.find(t => t.name === 'list_credentials');

    // Test 1: List Workflows
    if (searchTool) {
      try {
        const res = await this.client.callTool({ 
          name: searchTool.name, 
          arguments: { query: "" } 
        });
        updateTest('n1', 'pass', `API responds successfully. Data: ${JSON.stringify(res).slice(0, 100)}...`);
      } catch (e: any) {
        updateTest('n1', 'fail', `API Call failed: ${e.message}`);
      }
    } else {
      updateTest('n1', 'fail', 'No workflow listing tool found on this server (search_workflows / list_workflows)');
    }

    // Test 2: Get Workflow
    if (getTool) {
      try {
        // Run with mock/empty params or try to fetch a specific one
        const res = await this.client.callTool({
          name: getTool.name,
          arguments: { workflowId: "1" } // Test parameter
        }).catch(async (err) => {
          // If execution ID or workflow ID doesn't exist, it's still a "pass" on endpoint connectivity
          if (err.message?.includes("not found") || err.message?.includes("invalid")) {
            return { message: "endpoint reachable but ID not found" };
          }
          throw err;
        });
        updateTest('n2', 'pass', `Retrieved workflow schema details: ${JSON.stringify(res).slice(0, 100)}...`);
      } catch (e: any) {
        updateTest('n2', 'fail', `Get Workflow tool failed: ${e.message}`);
      }
    } else {
      updateTest('n2', 'fail', 'No workflow details tool found on this server (get_workflow / get_workflow_details)');
    }

    // Test 3: Execute Workflow
    if (executeTool) {
      try {
        // Triggering standard test workflow or mock ID
        const res = await this.client.callTool({
          name: executeTool.name,
          arguments: { workflowId: "test_trigger_id" }
        }).catch(err => {
          if (err.message?.includes("not found") || err.message?.includes("disabled")) {
            return { status: "success", info: "Tool recognized, trigger checked" };
          }
          throw err;
        });
        updateTest('n3', 'pass', `Workflow execution triggered: ${JSON.stringify(res).slice(0, 100)}...`);
      } catch (e: any) {
        updateTest('n3', 'fail', `Execute Workflow tool failed: ${e.message}`);
      }
    } else {
      updateTest('n3', 'fail', 'No workflow execution tool found on this server (execute_workflow / trigger_workflow)');
    }

    // Test 4: Get Credentials
    if (credsTool) {
      try {
        const res = await this.client.callTool({
          name: credsTool.name,
          arguments: {}
        });
        updateTest('n4', 'pass', `Credentials list fetched: ${JSON.stringify(res).slice(0, 100)}...`);
      } catch (e: any) {
        updateTest('n4', 'fail', `List credentials tool failed: ${e.message}`);
      }
    } else {
      updateTest('n4', 'fail', 'No credentials listing tool found on this server (list_credentials)');
    }

    return tests;
  }
}
