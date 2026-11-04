import { Page } from 'playwright';
import { BrowserSessionManager } from '../core/browser_session_manager.js';
import { PublishResult } from './linkedin_publisher.js';

export interface FacebookPostOptions {
  content: string;
  mediaPath?: string;
  pageUrl?: string; // Optional specific Page URL or defaults to main feed
}

export class FacebookPublisher {
  constructor(private session: BrowserSessionManager) {}

  /**
   * Autonomously publish content to Facebook Feed or Page.
   */
  async publish(options: FacebookPostOptions): Promise<PublishResult> {
    const timestamp = new Date().toISOString();
    let page: Page | null = null;

    try {
      page = await this.session.newPage();
      const targetUrl = options.pageUrl || 'https://www.facebook.com/';
      console.log(`🌐 Navigating to Facebook: ${targetUrl}...`);
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(3500);

      // Check session
      const isLoginVisible = await page.locator('#email, input[name="email"]').first().isVisible().catch(() => false);
      if (isLoginVisible) {
        throw new Error('Facebook session unauthenticated. Supply valid persistent session cookies in UserDataDir.');
      }

      console.log('📝 Triggering post composition input...');
      // Click on "What's on your mind?" trigger
      const composeTrigger = page.locator('div[role="button"]:has-text("What\'s on your mind?"), span:has-text("What\'s on your mind?"), div[aria-label*="Create a post"]').first();
      await composeTrigger.waitFor({ state: 'visible', timeout: 15000 });
      await composeTrigger.click();
      await page.waitForTimeout(2000);

      // Locate the post modal textbox
      console.log('⌨️ Typing Facebook post content...');
      const textBox = page.locator('div[role="textbox"][contenteditable="true"], div[aria-label*="What\'s on your mind"]').first();
      await textBox.waitFor({ state: 'visible', timeout: 10000 });
      await textBox.click();
      await page.keyboard.type(options.content, { delay: 30 });
      await page.waitForTimeout(1500);

      // Handle media attachment if provided
      if (options.mediaPath) {
        console.log(`🖼️ Uploading media: ${options.mediaPath}...`);
        const photoIcon = page.locator('div[aria-label="Photo/video"], div[aria-label*="photo"]').first();
        if (await photoIcon.isVisible().catch(() => false)) {
          await photoIcon.click();
          await page.waitForTimeout(1500);
        }

        const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"]').first();
        if (await fileInput.count() > 0) {
          await fileInput.setInputFiles(options.mediaPath);
          await page.waitForTimeout(4000);
        }
      }

      // Submit publication
      console.log('🚀 Clicking Post...');
      const postButton = page.locator('div[aria-label="Post"][role="button"], button:has-text("Post")').first();
      await postButton.waitFor({ state: 'visible', timeout: 10000 });
      await postButton.click();

      // Stealth cool-down
      await page.waitForTimeout(6000);

      const screenshotPath = `screenshots/facebook_${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {});

      return {
        success: true,
        platform: 'facebook',
        timestamp,
        screenshotPath,
      };
    } catch (error: any) {
      console.error('❌ Facebook publishing error:', error.message);
      return {
        success: false,
        platform: 'facebook',
        timestamp,
        error: error.message,
      };
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }
}
