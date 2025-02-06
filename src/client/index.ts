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
  private isInternalLink(href: string): boolean {
    try {
      const url = new URL(href, window.location.origin);
      return url.origin === window.location.origin;
    } catch {
      // If href is relative path, it's internal
      return true;
    }
  }
  private handleClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const clickElement = this.findClickableElement(target);

    if (!clickElement) return;
    // Handle links specifically
    if (clickElement.tagName === 'A') {
      const link = clickElement as HTMLAnchorElement;
      const href = link.href;

      if (this.isInternalLink(href)) {
        // Track internal navigation
        this.trigger('click', {
          meta: {
            type: 'navigation',
            from: window.location.pathname,
            to: new URL(href, window.location.origin).pathname,
            text: link.textContent?.trim() || undefined,
          },
        });
      }
      return;
    }

    // Check if element has analytics attribute
    const analyticsAttr = clickElement.getAttribute('data-analytics');
    if (!analyticsAttr) return;

    // Gather metadata about the clicked element
    const metadata = {
      elementId: clickElement.id || undefined,
      elementClass: clickElement.className || undefined,
      text: clickElement.textContent?.trim() || undefined,
      href: (clickElement as HTMLAnchorElement).href || undefined,
      // Allow custom data attributes
      ...this.getDataAttributes(clickElement),
    };

    this.trigger('click', {
      meta: metadata,
      props: { name: analyticsAttr },
    });
  };

  private findClickableElement(
    element: HTMLElement | null
  ): HTMLElement | null {
    while (element && element !== document.body) {
      if (
        element.tagName === 'A' ||
        element.tagName === 'BUTTON' ||
        element.hasAttribute('data-analytics')
      ) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }

  private getDataAttributes(element: HTMLElement): Record<string, string> {
    const dataset = element.dataset;
    const attributes: Record<string, string> = {};

    for (const [key, value] of Object.entries(dataset)) {
      // Skip our main analytics attribute
      if (key !== 'analytics' && value !== undefined) {
        attributes[key] = value;
      }
    }

    return attributes;
  }

  private handleError = (event: ErrorEvent | PromiseRejectionEvent): void => {
    const isPromiseError = event instanceof PromiseRejectionEvent;
    const error = isPromiseError ? event.reason : event.error;

    const metadata = {
      type: isPromiseError ? 'promise_rejection' : 'runtime_error',
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      source: (event as ErrorEvent).filename || undefined,
      line: (event as ErrorEvent).lineno || undefined,
      column: (event as ErrorEvent).colno || undefined,
    };

    this.trigger('error', {
      meta: metadata,
      props: {
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
    });
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
      document.addEventListener('click', this.handleClick);
      window.addEventListener('error', this.handleError);
      window.addEventListener('unhandledrejection', this.handleError);
    }
  }
}

// Initialize and expose to window
const analytics = new Analytics();
analytics.start();

// Using our global Window interface
window.analytics = analytics.trigger.bind(analytics);
