# MCP Inspector - Connection Verification Dashboard

MCP Inspector is a professional debugging and diagnostic tool built to verify, troubleshoot, and monitor Model Context Protocol (MCP) server connections (such as the **n8n MCP server**) from Antigravity IDE. It supports both **SSE (HTTP)** and **Stdio (Subprocess)** transport methods.

---

## 🛠 Tech Stack & Features

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, Zustand
- **Backend**: Node.js, Express, tsx (ESM TypeScript execution)
- **SDK**: `@modelcontextprotocol/sdk` (Official Client Protocol SDK)
- **Handshake Diagnostics**: Visualizes protocol version, server identity details, and active server capabilities.
- **Raw JSON Traffic Monitor**: Chrome DevTools-style network panel showing JSON payloads of every request/response.
- **Interactive Tool Runner**: Automatically parses tool input schemas and generates dynamic forms to run tests.
- **Automated Health Suite**: Validation checklist (reachability, handshake, discovery endpoints) with an overall score (0-100) and error recovery guidelines.
- **n8n Integration Tests**: Evaluates `list_workflows`, `get_workflow`, `execute_workflow`, and `list_credentials` tool calls.

---

## 🚀 Getting Started

### 1. Installation
All packages and dependencies are pre-installed in the workspace. If setting up on a new environment, run:
```bash
npm install
```

### 2. Run the Full-Stack Application
Start both the React Vite frontend and Express proxy backend concurrently with:
```bash
npm start
```

This starts:
- **Frontend client**: `http://localhost:5173`
- **Express proxy server**: `http://localhost:3001` (Vite is pre-configured to proxy `/api` routes here)

To run the services separately:
- **Backend proxy**: `npm run server`
- **Vite dev server**: `npm run dev`

---

## 🔌 How to Connect an MCP Server

Open your browser to `http://localhost:5173`. 

### A. Connecting to n8n Native MCP Server (Streamable HTTP)
1. On the **Connection Panel** (found on the Dashboard or Inspector Panel page), select **SSE Transport (HTTP)**.
2. Enter the server's Endpoint URL:
   - *For local n8n:* `http://localhost:5678/mcp-server/http`
   - *For cloud/custom instance:* `https://<your-n8n-instance-url>/mcp-server/http`
3. Enter your **Instance-level MCP Access Token**:
   - Go to your n8n Editor UI -> **Settings** -> **Instance-level MCP**.
   - Toggle the feature **ON** and click **Generate Token**. Copy this token.
   - *Note: A standard n8n REST API key will NOT work and will return a `401 Unauthorized` error.*
4. Paste the token into the **Bearer / API Token (Optional)** field.
5. Click **Check Connection**.

### B. Connecting via Legacy SSE (HTTP+SSE)
1. Select **SSE Transport (HTTP)**.
2. Enter the SSE endpoint URL (e.g. `http://localhost:3000/sse` or a custom proxy).
3. Click **Check Connection**.

### C. Connecting via Stdio (Local Subprocess)
1. Select **Stdio Process (Local Command)**.
2. Enter the command (e.g. `npx` or `node`).
3. Enter the arguments (e.g. `-y @modelcontextprotocol/server-everything`).
4. Click **Check Connection**.

---

## 🧪 How to Test n8n MCP Connection

### 1. Establish SSE Connection
Follow the SSE connection steps above to link the dashboard to your running n8n instance's MCP endpoint.

### 2. Run Automated Diagnostics Checklist
1. Navigate to the **Health & Tests** page from the sidebar.
2. Click **Run Diagnostics**.
3. View the validation checklist. The score (0-100) will calculate based on:
   - URL validation checks
   - Server reachability and latency checks
   - MCP protocol handshake success
   - Responsive tools and resources endpoints
4. The dashboard will automatically run n8n-specific tests to verify:
   - Workflows search API (`search_workflows`)
   - Workflow details fetch API (`get_workflow_details`)
   - Workflow trigger API (`execute_workflow`)
   - Credentials list API (`list_credentials`)

### 3. Execute Interactive Tests
1. Navigate to the **Tools Explorer** page.
2. In the dropdown, select `search_workflows` or `execute_workflow`.
3. Click the **Prefill n8n verification arguments** link. It will automatically populate the inputs.
4. Click **Run MCP Test Tool Call**.
5. Inspect the execution results in the **Execution Raw Response JSON** panel.

### 4. Monitor Traffic JSON
1. Navigate to the **Inspector Panel** page.
2. Under **Raw Traffic**, view the logs of your recent requests and responses.
3. Click a row to see the exact syntax-highlighted JSON structure of the sent request and received response.

---

## 🎯 Expected Successful Outputs

### Successful Handshake Check
On connection success, the **Server Capabilities** card will display:
- **MCP version**: `2025-03-26`
- **Server Name**: `n8n-mcp`
- Checked icons: `✓ Tools Discovery`, `✓ Resources Access`, `✓ Prompts Library`

And the **Timeline** will show:
```text
[19:12:00] [info] Initiated connection (SSE)
[19:12:01] [info] Sending initialize request (Handshake)...
[19:12:01] [success] MCP Handshake successful
[19:12:02] [success] Server Capabilities fetched
[19:12:02] [success] Discovered 4 tools
[19:12:02] [success] Discovered 3 resources
```

### Successful Tool Execution Response
When executing `search_workflows` tool, the raw response JSON viewer will display:
```json
{
  "workflows": [
    {
      "id": "wf_1",
      "name": "Sync Shopify Leads to Salesforce",
      "active": true,
      "nodesCount": 6
    }
  ]
}
```

---

## 💡 Troubleshooting & Error Recovery

If a connection check fails, review the diagnostic flags and consult the built-in guide at the bottom of the **Health & Tests** page:

- **502 Bad Gateway**: This indicates the Express backend proxy on port `3001` is not running. If you ran `npm start` but the backend crashed on startup, start it directly using:
  ```bash
  npx tsx server/index.ts
  ```
- **401 Unauthorized**: You are likely using a standard n8n REST API Key. You must generate and use the specific **Instance-level MCP Access Token** from your n8n settings (*Settings -> Instance-level MCP*).
- **Hangs on "Connecting..." / Timeout**: If the connection takes several minutes or times out, verify that you are connecting to a Streamable HTTP endpoint using `/http` or `/mcp-server/http`. The backend will automatically switch to the `StreamableHTTPClientTransport` to prevent timeouts.
- **Connection Refused**: Verify that your n8n instance is running and reachable on port `5678`.
- **IPv4/IPv6 loopback mismatch**: If curl connects to the backend but the browser returns a proxy error, ensure the proxy is pointed to `127.0.0.1:3001` rather than `localhost:3001`. (Vite is pre-configured to handle this automatically).

---

## 🚀 Production Deployment Guide

Since this is a full-stack application (Vite React frontend + Node.js Express backend), the easiest way to deploy it for free is to host the backend on **Render** (or Railway) and the frontend on **Vercel** (or Netlify).

### 1. Deploy the Backend Proxy (Express Server) on Render
1. Sign up on [Render](https://render.com) and link your GitHub account.
2. Click **New +** -> **Web Service**.
3. Select this repository (`MCP-Connection-Verification-Dashboard`).
4. Configure the settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npx tsx server/index.ts`
5. Deploy the service and copy the generated Service URL (e.g. `https://mcp-inspector-backend.onrender.com`).

### 2. Deploy the Frontend (Vite App) on Vercel
1. Sign up on [Vercel](https://vercel.com) and link your GitHub.
2. Click **Add New** -> **Project** and select this repository.
3. In the **Environment Variables** section, add:
   - Key: `VITE_API_URL`
   - Value: `https://<your-render-backend-url>` (paste the URL you copied from Render, without trailing slash)
4. Click **Deploy**.
5. Your dashboard will now be live on Vercel's static domain and will dynamically route all requests to your deployed Render backend!

### 3. Deploy the Frontend on Cloudflare Pages (Alternative)
You can deploy the static frontend to Cloudflare Pages either via git integration or via CLI.

#### Option A: Deploy via GitHub Integration (Recommended)
1. Sign up/Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **Workers & Pages** -> **Create Application** -> **Pages** tab -> **Connect to Git**.
3. Select this GitHub repository (`MCP-Connection-Verification-Dashboard`).
4. Configure the build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
5. Go to **Environment Variables (advanced)** and add:
   - Name: `VITE_API_URL`
   - Value: `https://<your-render-backend-url>` (your deployed Express backend URL, without trailing slash)
6. Click **Save and Deploy**. Cloudflare will automatically build and publish your dashboard, and future git pushes will trigger automatic deployments.

#### Option B: Deploy via Cloudflare Wrangler CLI
1. Build the frontend production bundle:
   ```bash
   npm run build
   ```
2. Authenticate the local Wrangler CLI with your Cloudflare account:
   ```bash
   npx wrangler login
   ```
3. Deploy the `dist` folder to Cloudflare Pages:
   ```bash
   npx wrangler pages deploy dist --project-name mcp-connection-dashboard
   ```

