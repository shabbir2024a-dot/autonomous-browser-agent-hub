import { chromium, Browser, BrowserContext, Page } from 'playwright';

export interface SessionConfig {
  headless?: boolean;
  userDataDir?: string;
  viewport?: { width: number; height: number };
  userAgent?: string;
}

export class BrowserSessionManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor(private config: SessionConfig = {}) {}

  /**
   * Launch a persistent, stealth-configured browser context that preserves
   * session cookies, tokens, and multi-tab state.
   */
  async getContext(): Promise<BrowserContext> {
    if (this.context) {
      return this.context;
    }

    const defaultAgent =
      this.config.userAgent ||
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

    if (this.config.userDataDir) {
      this.context = await chromium.launchPersistentContext(this.config.userDataDir, {
        headless: this.config.headless ?? false,
        viewport: this.config.viewport || { width: 1280, height: 800 },
        userAgent: defaultAgent,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
      });
    } else {
      this.browser = await chromium.launch({
        headless: this.config.headless ?? false,
        args: ['--disable-blink-features=AutomationControlled'],
      });
      this.context = await this.browser.newContext({
        viewport: this.config.viewport || { width: 1280, height: 800 },
        userAgent: defaultAgent,
      });
    }

    return this.context;
  }

  async newPage(): Promise<Page> {
    const ctx = await this.getContext();
    const page = await ctx.newPage();
    // Inject stealth flags into window.navigator
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    return page;
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
