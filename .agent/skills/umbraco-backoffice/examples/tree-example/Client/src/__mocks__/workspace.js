// Mock for @umbraco-cms/backoffice/workspace
export class UmbWorkspaceRouteManager {
  #routes = [];

  constructor(host) {
    this.host = host;
  }

  setRoutes(routes) {
    this.#routes = routes;
  }

  getRoutes() {
    return this.#routes;
  }
}
