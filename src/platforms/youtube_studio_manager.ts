import { Page } from 'playwright';
import { BrowserSessionManager } from '../core/browser_session_manager.js';

export interface YouTubeUploadOptions {
  videoPath: string;
  title: string;
  description: string;
  tags?: string[];
  thumbnailPath?: string;
  visibility?: 'public' | 'unlisted' | 'private';
  isMadeForKids?: boolean;
}

export interface YouTubeOperationResult {
  success: boolean;
  platform: 'youtube';
  timestamp: string;
  videoId?: string;
  statusMessage?: string;
  error?: string;
}

export class YouTubeStudioManager {
  constructor(private session: BrowserSessionManager) {}

  /**
   * Autonomously upload and configure a video on YouTube Studio.
   */
  async uploadVideo(options: YouTubeUploadOptions): Promise<YouTubeOperationResult> {
    const timestamp = new Date().toISOString();
    let page: Page | null = null;

    try {
      page = await this.session.newPage();
      console.log('🎥 Navigating to YouTube Studio...');
      await page.goto('https://studio.youtube.com', { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(3000);

      // Verify channel authorization
      const isCreateVisible = await page.locator('#create-icon, button[aria-label="Create"]').first().isVisible().catch(() => false);
      if (!isCreateVisible) {
        throw new Error('YouTube Studio session missing or not authorized. Ensure persistent Google login.');
      }

      console.log('📤 Initiating upload dialog...');
      await page.locator('#create-icon, button[aria-label="Create"]').first().click();
      await page.waitForTimeout(1000);

      const uploadBtn = page.locator('tp-yt-paper-item:has-text("Upload videos"), #text-item-0').first();
      await uploadBtn.click();
      await page.waitForTimeout(2000);

      // Supply video binary file
      console.log(`📁 Uploading video file: ${options.videoPath}...`);
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(options.videoPath);
      await page.waitForTimeout(6000);

      // Fill Title
      console.log('🏷️ Setting title & description...');
      const titleInput = page.locator('#textbox[aria-label*="title"], #input-0').first();
      if (await titleInput.isVisible()) {
        await titleInput.click();
        await page.keyboard.press('Meta+A');
        await page.keyboard.press('Backspace');
        await page.keyboard.type(options.title.slice(0, 100), { delay: 20 });
      }

      // Fill Description
      const descInput = page.locator('#textbox[aria-label*="description"], #input-1').first();
      if (await descInput.isVisible()) {
        await descInput.click();
        await page.keyboard.type(options.description.slice(0, 5000), { delay: 10 });
      }

      // Handle "Not made for kids" compliance
      const notForKidsRadio = page.locator('tp-yt-paper-radio-button[name="NOT_MADE_FOR_KIDS"], [name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').first();
      if (await notForKidsRadio.isVisible().catch(() => false)) {
        await notForKidsRadio.click();
      }

      // Optional thumbnail
      if (options.thumbnailPath) {
        const thumbInput = page.locator('input#file-loader, input[type="file"][accept*="image"]').first();
        if (await thumbInput.count() > 0) {
          await thumbInput.setInputFiles(options.thumbnailPath).catch(() => {});
        }
      }

      // Advance through Steps (Details -> Video Elements -> Checks -> Visibility)
      for (let i = 0; i < 3; i++) {
        const nextBtn = page.locator('#next-button, button:has-text("Next")').first();
        if (await nextBtn.isVisible().catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(2000);
        }
      }

      // Visibility Selection
      const visibility = options.visibility || 'unlisted';
      console.log(`🔒 Applying visibility setting: ${visibility}...`);
      const visRadio = page.locator(`tp-yt-paper-radio-button[name="${visibility.toUpperCase()}"]`).first();
      if (await visRadio.isVisible().catch(() => false)) {
        await visRadio.click();
      }

      // Final Save / Publish
      const doneBtn = page.locator('#done-button, button:has-text("Save"), button:has-text("Publish")').first();
      await doneBtn.waitFor({ state: 'visible', timeout: 15000 });
      await doneBtn.click();
      await page.waitForTimeout(5000);

      return {
        success: true,
        platform: 'youtube',
        timestamp,
        statusMessage: `Video "${options.title}" uploaded successfully with visibility ${visibility}.`,
      };
    } catch (error: any) {
      console.error('❌ YouTube Studio error:', error.message);
      return {
        success: false,
        platform: 'youtube',
        timestamp,
        error: error.message,
      };
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }

  /**
   * Scrapes top-line channel metrics from YouTube Studio dashboard.
   */
  async getChannelAnalyticsSummary(): Promise<{ views?: string; watchTime?: string; subscribers?: string }> {
    let page: Page | null = null;
    try {
      page = await this.session.newPage();
      await page.goto('https://studio.youtube.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);

      const metrics = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.metric-value-container, .key-metric'));
        return {
          views: cards[0]?.textContent?.trim(),
          watchTime: cards[1]?.textContent?.trim(),
          subscribers: cards[2]?.textContent?.trim(),
        };
      });

      return metrics;
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }
}
