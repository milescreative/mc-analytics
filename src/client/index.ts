// src/client/index.ts
import { Config } from './config';
import { sendEvent } from './transport';
import type { EventOptions, EventPayload } from './types';

class Analytics {
  private config: Config;
  private lastPage: string | null = null;

  constructor() {
    this.config = new Config();
  }

  private createPayload(name: string, options?: EventOptions): EventPayload {
    return {
      name,
      domain: this.config.domain,
      url: options?.u || window.location.href,
      referrer: document.referrer || null,
      meta: options?.meta ? JSON.stringify(options.meta) : undefined,
      props: options?.props ? JSON.stringify(options.props) : undefined,
    };
  }

  public trigger(name: string, options?: EventOptions): void {
    // Skip if on localhost/development
    if (this.config.shouldExcludePath()) {
      console.warn('Analytics ignored: local environment');
      options?.callback?.({ status: 0 });
      return;
    }

    // Skip if automation/testing environment
    if (
      window._phantom ||
      window.__nightmare ||
      window.navigator.webdriver ||
      window.Cypress
    ) {
      console.warn('Analytics ignored: automation detected');
      options?.callback?.({ status: 0 });
      return;
    }

    const payload = this.createPayload(name, options);
    sendEvent(this.config.endpoint, payload, options);
  }

  private handlePageview = (isSPA = false): void => {
    const currentPath = window.location.pathname;
    if (!isSPA && this.lastPage === currentPath) return;

    this.lastPage = currentPath;
    this.trigger('pageview');
  };

  public start(): void {
    // Handle initial pageview
    const isPrerendering =
      document.visibilityState !== 'visible' &&
      document.visibilityState !== 'hidden';

    if (isPrerendering) {
      document.addEventListener('visibilitychange', () => {
        if (!this.lastPage && document.visibilityState === 'visible') {
          this.handlePageview();
        }
      });
    } else {
      this.handlePageview();
    }

    // Handle SPA navigation
    const history = window.history;
    if (history.pushState) {
      const originalPushState = history.pushState;

      history.pushState = (
        data: unknown,
        unused: string,
        url?: string | URL | null
      ) => {
        originalPushState.call(history, data, unused, url);
        this.handlePageview(true);
      };

      window.addEventListener('popstate', () => this.handlePageview(true));
    }
  }
}

// Initialize and expose to window
const analytics = new Analytics();
analytics.start();

// Using our global Window interface
window.analytics = analytics.trigger.bind(analytics);
