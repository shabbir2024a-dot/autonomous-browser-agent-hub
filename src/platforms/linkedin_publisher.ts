import { Page } from 'playwright';
import { BrowserSessionManager } from '../core/browser_session_manager.js';

export interface LinkedInPostOptions {
  content: string;
  mediaPath?: string;
  visibility?: 'public' | 'connections';
}

export interface PublishResult {
  success: boolean;
  platform: string;
  timestamp: string;
  postUrl?: string;
  screenshotPath?: string;
  error?: string;
}

export class LinkedInPublisher {
  constructor(private session: BrowserSessionManager) {}

  /**
   * Autonomously compose and publish a post to LinkedIn using stealth browser automation.
   */
  async publish(options: LinkedInPostOptions): Promise<PublishResult> {
    const timestamp = new Date().toISOString();
    let page: Page | null = null;

    try {
      page = await this.session.newPage();
      console.log('🌐 Navigating to LinkedIn Feed...');
      await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Verify authentication state
      const isLoggedOut = await page.locator('a[href*="/login"], a[href*="/signup"]').first().isVisible().catch(() => false);
      if (isLoggedOut) {
        throw new Error('LinkedIn session expired or not authenticated. Please provide persistent session cookies.');
      }

      console.log('✍️ Opening post creation modal...');
      // Target the "Start a post" button
      const startPostBtn = page.locator('button:has-text("Start a post"), button[aria-label="Create a post"], .share-box-feed-entry__top-bar button').first();
      await startPostBtn.waitFor({ state: 'visible', timeout: 15000 });
      await startPostBtn.click();
      await page.waitForTimeout(2000);

      // Locate the rich-text editor
      const editor = page.locator('div[role="textbox"][aria-label*="post"], div.editor-content div.ql-editor, div.share-creation-state__text-editor div[role="textbox"]').first();
      await editor.waitFor({ state: 'visible', timeout: 15000 });
      await editor.click();

      // Human-like keystroke pacing
      console.log('⌨️ Typing post content...');
      await page.keyboard.type(options.content, { delay: 25 });
      await page.waitForTimeout(1500);

      // Handle optional media attachment
      if (options.mediaPath) {
        console.log(`🖼️ Attaching media from ${options.mediaPath}...`);
        const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"]').first();
        if (await fileInput.count() > 0) {
          await fileInput.setInputFiles(options.mediaPath);
          await page.waitForTimeout(4000);

          // Click "Next" on the image preview dialog if present
          const nextBtn = page.locator('button:has-text("Next"), [aria-label="Next"]').first();
          if (await nextBtn.isVisible().catch(() => false)) {
            await nextBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      }

      // Find and click the final "Post" button
      console.log('🚀 Submitting publication...');
      const postBtn = page.locator('button:has-text("Post"):not([disabled]), button.share-actions__primary-action:not([disabled])').first();
      await postBtn.waitFor({ state: 'visible', timeout: 10000 });
      await postBtn.click();

      // Wait for submission confirmation
      await page.waitForTimeout(5000);

      const screenshotPath = `screenshots/linkedin_${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {});

      return {
        success: true,
        platform: 'linkedin',
        timestamp,
        screenshotPath,
      };
    } catch (error: any) {
      console.error('❌ LinkedIn publishing error:', error.message);
      return {
        success: false,
        platform: 'linkedin',
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
