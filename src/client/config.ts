// src/client/config.ts
export class Config {
  private scriptEl: HTMLScriptElement;
  public endpoint: string;
  public domain: string;

  constructor() {
    this.scriptEl = document.currentScript as HTMLScriptElement;

    if (!this.scriptEl) {
      throw new Error('Analytics script element not found');
    }

    this.domain = this.scriptEl.getAttribute('data-domain') || '';
    if (!this.domain) {
      throw new Error('Missing required data-domain attribute');
    }

    this.endpoint =
      this.scriptEl.getAttribute('data-api') ||
      new URL(this.scriptEl.src).origin + '/api/event';
  }

  shouldExcludePath(): boolean {
    if (
      /^localhost$|^127(\.[0-9]+){0,2}\.[0-9]+$|^\[::1?\]$/.test(
        location.hostname
      ) ||
      location.protocol === 'file:'
    ) {
      return false;
    }
    return false;
  }
}
