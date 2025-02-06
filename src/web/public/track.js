// src/client/config.ts
class Config {
  scriptEl;
  endpoint;
  domain;
  constructor() {
    this.scriptEl = document.currentScript;
    if (!this.scriptEl) {
      throw new Error("Analytics script element not found");
    }
    this.domain = this.scriptEl.getAttribute("data-domain") || "";
    if (!this.domain) {
      throw new Error("Missing required data-domain attribute");
    }
    this.endpoint = this.scriptEl.getAttribute("data-api") || new URL(this.scriptEl.src).origin + "/api/event";
  }
  shouldExcludePath() {
    if (/^localhost$|^127(\.[0-9]+){0,2}\.[0-9]+$|^\[::1?\]$/.test(location.hostname) || location.protocol === "file:") {
      return false;
    }
    return false;
  }
}

// src/client/transport.ts
async function sendEvent(endpoint, payload, options) {
  const logEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    endpoint,
    payload
  }) + `
`;
  console.log("Analytics Event:", {
    endpoint,
    payload
  });
  try {
    console.log("analytics.log", logEntry);
    options?.callback?.({ status: 200 });
  } catch (error) {
    console.warn("Failed to log analytics event:", error);
    options?.callback?.({ status: 500 });
  }
}

// src/client/index.ts
class Analytics {
  config;
  lastPage = null;
  constructor() {
    this.config = new Config;
  }
  createPayload(name, options) {
    return {
      name,
      domain: this.config.domain,
      url: options?.u || window.location.href,
      referrer: document.referrer || null,
      meta: options?.meta ? JSON.stringify(options.meta) : undefined,
      props: options?.props ? JSON.stringify(options.props) : undefined
    };
  }
  trigger(name, options) {
    if (this.config.shouldExcludePath()) {
      console.warn("Analytics ignored: local environment");
      options?.callback?.({ status: 0 });
      return;
    }
    if (window._phantom || window.__nightmare || window.navigator.webdriver || window.Cypress) {
      console.warn("Analytics ignored: automation detected");
      options?.callback?.({ status: 0 });
      return;
    }
    const payload = this.createPayload(name, options);
    sendEvent(this.config.endpoint, payload, options);
  }
  handlePageview = (isSPA = false) => {
    const currentPath = window.location.pathname;
    if (!isSPA && this.lastPage === currentPath)
      return;
    this.lastPage = currentPath;
    this.trigger("pageview");
  };
  handleClick = (event) => {
    const target = event.target;
    const clickElement = this.findClickableElement(target);
    if (!clickElement)
      return;
    const analyticsAttr = clickElement.getAttribute("data-analytics");
    if (!analyticsAttr)
      return;
    const metadata = {
      elementId: clickElement.id || undefined,
      elementClass: clickElement.className || undefined,
      text: clickElement.textContent?.trim() || undefined,
      href: clickElement.href || undefined,
      ...this.getDataAttributes(clickElement)
    };
    this.trigger("click", {
      meta: metadata,
      props: { name: analyticsAttr }
    });
  };
  findClickableElement(element) {
    while (element && element !== document.body) {
      if (element.tagName === "A" || element.tagName === "BUTTON" || element.hasAttribute("data-analytics")) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }
  getDataAttributes(element) {
    const dataset = element.dataset;
    const attributes = {};
    for (const [key, value] of Object.entries(dataset)) {
      if (key !== "analytics" && value !== undefined) {
        attributes[key] = value;
      }
    }
    return attributes;
  }
  start() {
    const isPrerendering = document.visibilityState !== "visible" && document.visibilityState !== "hidden";
    if (isPrerendering) {
      document.addEventListener("visibilitychange", () => {
        if (!this.lastPage && document.visibilityState === "visible") {
          this.handlePageview();
        }
      });
    } else {
      this.handlePageview();
    }
    const history = window.history;
    if (history.pushState) {
      const originalPushState = history.pushState;
      history.pushState = (data, unused, url) => {
        originalPushState.call(history, data, unused, url);
        this.handlePageview(true);
      };
      window.addEventListener("popstate", () => this.handlePageview(true));
      document.addEventListener("click", this.handleClick);
    }
  }
}
var analytics = new Analytics;
analytics.start();
window.analytics = analytics.trigger.bind(analytics);
