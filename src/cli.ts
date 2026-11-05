import { BrowserSessionManager } from './core/browser_session_manager.js';
import { YouTubeViralRadar } from './intelligence/youtube_viral_radar.js';
import { VideoProductionEngine } from './pipelines/video_production_engine.js';
import { CareerIntelligenceRobot } from './intelligence/career_intelligence_robot.js';
import { WhatsAppCommandGateway } from './dispatchers/whatsapp_command_gateway.js';

async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'all';

  console.log('===========================================================');
  console.log('🤖 Aegis AgentOS — Autonomous Multi-Agent Command Suite');
  console.log('===========================================================');
  console.log(`Action requested: ${action}\n`);

  const session = new BrowserSessionManager({ headless: true });

  try {
    if (action === 'radar') {
      const radar = new YouTubeViralRadar(session);
      const report = await radar.scanOutliers();
      console.log('\n✅ [Radar Summary]:', report.summary);
      console.log('\nTop Viral Concepts:');
      report.viralConcepts.forEach((c, i) => {
        console.log(` ${i + 1}. ${c.topic} (Score: ${c.estimatedRetentionScore}%)`);
      });
    } else if (action === 'produce') {
      const topic = args.slice(1).join(' ') || 'The 30-Millisecond Hydrostatic Shockwave';
      const engine = new VideoProductionEngine(session);
      const result = await engine.produceAndPublish({ topic, format: 'shorts' });
      console.log('\n✅ [Production Result]:', result);
    } else if (action === 'career') {
      const robot = new CareerIntelligenceRobot(session);
      const report = await robot.scanOpportunities();
      console.log('\n✅ [Career Summary]:', report.summary);
      console.log('\nTop High-Match Roles:');
      report.highMatchOpportunities.forEach((opp, i) => {
        console.log(` ${i + 1}. ${opp.title} @ ${opp.company} (Match: ${opp.matchScore}%)`);
      });
    } else if (action === 'gateway') {
      const query = args.slice(1).join(' ') || '!help';
      const gateway = new WhatsAppCommandGateway(session);
      const res = await gateway.handleMessage(query);
      console.log('\n📱 [WhatsApp Gateway Response]:\n');
      console.log(res.responseText);
    } else if (action === 'all') {
      console.log('🚀 Running Unified Omni-Agentic Autonomous Execution Suite...\n');

      console.log('--- Phase 1: WhatsApp Command Center Simulation ---');
      const gateway = new WhatsAppCommandGateway(session);
      const helpRes = await gateway.handleMessage('!help');
      console.log(helpRes.responseText);

      console.log('\n--- Phase 2: YouTube Viral Radar ---');
      const radarRes = await gateway.handleMessage('!radar');
      console.log(radarRes.responseText);

      console.log('\n--- Phase 3: Career & Client Opportunity Intelligence ---');
      const careerRes = await gateway.handleMessage('!jobs');
      console.log(careerRes.responseText);

      console.log('\n--- Phase 4: Production Engine Simulation ---');
      const prodRes = await gateway.handleMessage('!produce Extreme Hydrodynamic Cavitation Shockwave');
      console.log(prodRes.responseText);

      console.log('\n✨ All autonomous modules executed successfully!');
    } else {
      console.log(`Unknown action: ${action}. Use: radar | produce | career | gateway | all`);
    }
  } catch (err: any) {
    console.error('❌ Execution error:', err.message);
  } finally {
    await session.close();
  }
}

main().catch(console.error);
