import { MCPAgentBridge } from './core/mcp_agent_bridge.js';
import { BrowserSessionManager } from './core/browser_session_manager.js';
import { LinkedInPublisher } from './platforms/linkedin_publisher.js';
import { YouTubeStudioManager } from './platforms/youtube_studio_manager.js';
import { FacebookPublisher } from './platforms/facebook_publisher.js';
import { YouTubeViralRadar } from './intelligence/youtube_viral_radar.js';
import { VideoProductionEngine } from './pipelines/video_production_engine.js';
import { CareerIntelligenceRobot } from './intelligence/career_intelligence_robot.js';
import { WhatsAppCommandGateway } from './dispatchers/whatsapp_command_gateway.js';

export {
  MCPAgentBridge,
  BrowserSessionManager,
  LinkedInPublisher,
  YouTubeStudioManager,
  FacebookPublisher,
  YouTubeViralRadar,
  VideoProductionEngine,
  CareerIntelligenceRobot,
  WhatsAppCommandGateway,
};

async function main() {
  console.log('===========================================================');
  console.log('🤖 Aegis AgentOS (v2.0) — Autonomous Browser & Agent Hub');
  console.log('===========================================================');
  console.log('Architect: Shabbir Ahmed (AI Systems Architect & Staff TPM)');
  console.log('Engine: Playwright Stealth • MCP • WhatsApp Cloud AI\n');

  const bridge = new MCPAgentBridge(undefined, true);
  const tools = bridge.getAvailableTools();

  console.log(`🛠️ Registered ${tools.length} MCP Autonomous Agent Tools:`);
  tools.forEach((t) => {
    console.log(` - ${t.name}: ${t.description}`);
  });

  console.log('\n⚡ System initialized. Ready to accept autonomous agent tool calls.');
  await bridge.shutdown();
}

if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  main().catch(console.error);
}
