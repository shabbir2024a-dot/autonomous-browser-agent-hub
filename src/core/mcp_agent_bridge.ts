import { BrowserSessionManager } from './browser_session_manager.js';
import { LinkedInPublisher } from '../platforms/linkedin_publisher.js';
import { YouTubeStudioManager } from '../platforms/youtube_studio_manager.js';
import { FacebookPublisher } from '../platforms/facebook_publisher.js';

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

  constructor(userDataDir?: string, headless: boolean = true) {
    this.session = new BrowserSessionManager({ userDataDir, headless });
    this.linkedIn = new LinkedInPublisher(this.session);
    this.youtube = new YouTubeStudioManager(this.session);
    this.facebook = new FacebookPublisher(this.session);
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

      default:
        throw new Error(`Tool "${name}" is not recognized by the MCP Agent Bridge.`);
    }
  }

  async shutdown(): Promise<void> {
    await this.session.close();
  }
}
