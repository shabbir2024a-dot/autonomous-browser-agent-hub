import { BrowserSessionManager } from './browser_session_manager.js';
import { LinkedInPublisher } from '../platforms/linkedin_publisher.js';
import { YouTubeStudioManager } from '../platforms/youtube_studio_manager.js';
import { FacebookPublisher } from '../platforms/facebook_publisher.js';
import { YouTubeViralRadar } from '../intelligence/youtube_viral_radar.js';
import { VideoProductionEngine } from '../pipelines/video_production_engine.js';
import { CareerIntelligenceRobot } from '../intelligence/career_intelligence_robot.js';
import { WhatsAppCommandGateway } from '../dispatchers/whatsapp_command_gateway.js';

export interface MCPToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export class MCPAgentBridge {
  private session: BrowserSessionManager;
  private linkedIn: LinkedInPublisher;
  private youtube: YouTubeStudioManager;
  private facebook: FacebookPublisher;
  private radar: YouTubeViralRadar;
  private videoEngine: VideoProductionEngine;
  private careerRobot: CareerIntelligenceRobot;
  private gateway: WhatsAppCommandGateway;

  constructor(userDataDir?: string, headless: boolean = true) {
    this.session = new BrowserSessionManager({ userDataDir, headless });
    this.linkedIn = new LinkedInPublisher(this.session);
    this.youtube = new YouTubeStudioManager(this.session);
    this.facebook = new FacebookPublisher(this.session);
    this.radar = new YouTubeViralRadar(this.session);
    this.videoEngine = new VideoProductionEngine(this.session);
    this.careerRobot = new CareerIntelligenceRobot(this.session);
    this.gateway = new WhatsAppCommandGateway(this.session);
  }

  /**
   * Schemas exposed to autonomous LLM agents (Claude 3.5, GPT-4o, Gemini 2.0).
   */
  getAvailableTools(): MCPToolDefinition[] {
    return [
      {
        name: 'publish_linkedin_post',
        description: 'Autonomously compose and publish a verified post on LinkedIn.',
        parameters: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'The text content to post on LinkedIn' },
            mediaPath: { type: 'string', description: 'Optional local absolute path to an image file' },
          },
          required: ['content'],
        },
      },
      {
        name: 'upload_youtube_video',
        description: 'Autonomously upload and configure a video on YouTube Studio.',
        parameters: {
          type: 'object',
          properties: {
            videoPath: { type: 'string', description: 'Local path to the video file' },
            title: { type: 'string', description: 'Video title (max 100 chars)' },
            description: { type: 'string', description: 'Video description with tags and chapters' },
            visibility: { type: 'string', enum: ['public', 'unlisted', 'private'] },
          },
          required: ['videoPath', 'title', 'description'],
        },
      },
      {
        name: 'publish_facebook_update',
        description: 'Autonomously post a status update or announcement to a Facebook feed or Page.',
        parameters: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'The text content to post' },
            mediaPath: { type: 'string', description: 'Optional path to an image to attach' },
          },
          required: ['content'],
        },
      },
      {
        name: 'scan_youtube_viral_radar',
        description: 'Scan benchmark science channels, calculate outlier multipliers, and synthesize high-retention video briefs.',
        parameters: {
          type: 'object',
          properties: {
            channels: { type: 'array', items: { type: 'string' }, description: 'Channel handles to benchmark' },
          },
          required: [],
        },
      },
      {
        name: 'produce_clean_video',
        description: 'Run automated video pipeline: script formula, neural voiceover, and clean FFmpeg merge (strictly zero text burns).',
        parameters: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: 'Scientific/engineering topic for the video' },
            format: { type: 'string', enum: ['shorts', 'long_form'], description: 'Target format' },
          },
          required: ['topic'],
        },
      },
      {
        name: 'scan_career_opportunities',
        description: 'Scan LinkedIn & tech portals for Staff TPM and AI Architect roles, score competency matches, and generate pitches.',
        parameters: {
          type: 'object',
          properties: {
            targetRole: { type: 'string', description: 'Role title or keywords to search' },
          },
          required: [],
        },
      },
      {
        name: 'dispatch_whatsapp_command',
        description: 'Process an incoming WhatsApp command and return an actionable agent response.',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'The command string (e.g., !radar, !produce, !jobs, !stats)' },
            sender: { type: 'string', description: 'Sender phone or identifier' },
          },
          required: ['message'],
        },
      },
    ];
  }

  /**
   * Router to execute an MCP tool invoked by an autonomous agent.
   */
  async executeTool(name: string, args: Record<string, any>): Promise<any> {
    console.log(`🤖 [MCP Bridge] Executing tool "${name}" with args:`, JSON.stringify(args));
    switch (name) {
      case 'publish_linkedin_post':
        return await this.linkedIn.publish({
          content: args.content,
          mediaPath: args.mediaPath,
        });

      case 'upload_youtube_video':
        return await this.youtube.uploadVideo({
          videoPath: args.videoPath,
          title: args.title,
          description: args.description,
          visibility: args.visibility || 'unlisted',
        });

      case 'publish_facebook_update':
        return await this.facebook.publish({
          content: args.content,
          mediaPath: args.mediaPath,
        });

      case 'scan_youtube_viral_radar':
        return await this.radar.scanOutliers(args.channels);

      case 'produce_clean_video':
        return await this.videoEngine.produceAndPublish({
          topic: args.topic,
          format: args.format || 'shorts',
        });

      case 'scan_career_opportunities':
        return await this.careerRobot.scanOpportunities(args.targetRole);

      case 'dispatch_whatsapp_command':
        return await this.gateway.handleMessage(args.message, args.sender);

      default:
        throw new Error(`Tool "${name}" is not recognized by the MCP Agent Bridge.`);
    }
  }

  async shutdown(): Promise<void> {
    await this.session.close();
  }
}
