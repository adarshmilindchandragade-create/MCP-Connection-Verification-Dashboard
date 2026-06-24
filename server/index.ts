import express from 'express';
import cors from 'cors';
import { MCPProxy } from './mcpProxy.js';
import { ConnectionConfig } from '../src/types/mcp.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const mcpProxy = new MCPProxy();

// SSE client logs stream
let logClients: express.Response[] = [];

const broadcastLog = (type: string, data: any) => {
  logClients.forEach(client => {
    client.write(`data: ${JSON.stringify({ type, data })}\n\n`);
  });
};

// Override addTrafficLog and addTimelineEvent to broadcast logs live via SSE
const originalAddTraffic = mcpProxy.addTrafficLog.bind(mcpProxy);
mcpProxy.addTrafficLog = (direction, method, payload, duration, error) => {
  originalAddTraffic(direction, method, payload, duration, error);
  const log = mcpProxy.trafficLogs[0];
  broadcastLog('traffic', log);
};

const originalAddTimeline = mcpProxy.addTimelineEvent.bind(mcpProxy);
mcpProxy.addTimelineEvent = (type, message) => {
  originalAddTimeline(type, message);
  const event = mcpProxy.timeline[mcpProxy.timeline.length - 1];
  broadcastLog('timeline', event);
};

// Endpoints
app.post('/api/connect', async (req, res) => {
  const { config, mock } = req.body as { config: ConnectionConfig; mock?: boolean };
  
  if (!config) {
    return res.status(400).json({ message: "Configuration is required" });
  }

  try {
    const result = await mcpProxy.connect(config, mock);
    res.json({
      status: "connected",
      ...result
    });
  } catch (err: any) {
    console.error("Connect error:", err);
    res.status(500).json({ 
      status: "disconnected",
      message: err.message || "Failed to establish MCP connection" 
    });
  }
});

app.post('/api/disconnect', async (req, res) => {
  try {
    await mcpProxy.disconnect();
    res.json({ message: "Disconnected successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to disconnect" });
  }
});

app.post('/api/execute', async (req, res) => {
  const { name, arguments: args, mock } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Tool name is required" });
  }

  try {
    const result = await mcpProxy.executeTool(name, args, mock);
    res.json(result);
  } catch (err: any) {
    console.error("Execution error:", err);
    res.status(500).json({ message: err.message || "Failed to execute tool" });
  }
});

app.post('/api/validate', async (req, res) => {
  const { config, mock } = req.body;
  try {
    const checks = await mcpProxy.validate(config, mock);
    res.json({ checks });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Validation failed" });
  }
});

app.post('/api/health/n8n', async (req, res) => {
  const { config, mock } = req.body;
  try {
    const tests = await mcpProxy.runN8NTests(config, mock);
    res.json({ tests });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "n8n test execution failed" });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    status: mcpProxy.client ? "connected" : "disconnected",
    isMock: mcpProxy.isMock,
    timeline: mcpProxy.timeline,
    config: mcpProxy.config
  });
});

app.get('/api/traffic', (req, res) => {
  res.json({
    traffic: mcpProxy.trafficLogs,
    timeline: mcpProxy.timeline
  });
});

// Live Server-Sent Events Logs Route
app.get('/api/logs/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  logClients.push(res);

  // Send initial data
  res.write(`data: ${JSON.stringify({ type: 'init', traffic: mcpProxy.trafficLogs, timeline: mcpProxy.timeline })}\n\n`);

  req.on('close', () => {
    logClients = logClients.filter(client => client !== res);
  });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[MCP Inspector Backend] Running on http://localhost:${PORT}`);
});
