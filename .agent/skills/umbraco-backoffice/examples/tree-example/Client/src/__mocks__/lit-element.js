// Mock for @umbraco-cms/backoffice/lit-element
export class UmbLitElement extends HTMLElement {
  observe(observable, callback) {
    // Mock observe - just store callback
    this._observers = this._observers || [];
    this._observers.push({ observable, callback });
  }

  consumeContext(token, callback) {
    // Mock consumeContext
    this._contextConsumers = this._contextConsumers || [];
    this._contextConsumers.push({ token, callback });
  }
}
