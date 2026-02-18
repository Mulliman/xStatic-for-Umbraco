// Mock for @umbraco-cms/backoffice/class-api
export class UmbContextBase {
  #host;
  #contextToken;

  constructor(host, contextToken) {
    this.#host = host;
    this.#contextToken = contextToken;
  }

  getHostElement() {
    return this.#host;
  }

  destroy() {
    // Override in subclass
  }
}
