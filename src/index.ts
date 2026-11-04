import { MCPAgentBridge } from './core/mcp_agent_bridge.js';
import { BrowserSessionManager } from './core/browser_session_manager.js';
import { LinkedInPublisher } from './platforms/linkedin_publisher.js';
import { YouTubeStudioManager } from './platforms/youtube_studio_manager.js';
import { FacebookPublisher } from './platforms/facebook_publisher.js';

export {
  MCPAgentBridge,
  BrowserSessionManager,
  LinkedInPublisher,
  YouTubeStudioManager,
  FacebookPublisher,
};

async function main() {
  console.log('===========================================================');
  console.log('🤖 Autonomous Browser Agent Hub — Multi-Platform AI Engine');
  console.log('===========================================================');
  console.log('Supported Targets: LinkedIn • YouTube Studio • Facebook');
  console.log('Engine: Playwright Stealth + Model Context Protocol (MCP)\n');

  const bridge = new MCPAgentBridge(undefined, true);
  const tools = bridge.getAvailableTools();

  console.log('🛠️ Registered MCP Autonomous Agent Tools:');
  tools.forEach((t) => {
    console.log(` - ${t.name}: ${t.description}`);
  });

  console.log('\n⚡ System initialized. Ready to accept autonomous agent tool calls.');
  await bridge.shutdown();
}

if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  main().catch(console.error);
}
