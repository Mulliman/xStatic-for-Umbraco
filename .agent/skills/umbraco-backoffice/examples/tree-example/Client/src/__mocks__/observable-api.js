// Mock for @umbraco-cms/backoffice/observable-api
export class UmbStringState {
  #value;
  #subscribers = [];

  constructor(initialValue) {
    this.#value = initialValue;
  }

  getValue() {
    return this.#value;
  }

  setValue(value) {
    this.#value = value;
    this.#subscribers.forEach(cb => cb(value));
  }

  asObservable() {
    return {
      subscribe: (callback) => {
        this.#subscribers.push(callback);
        callback(this.#value);
        return { unsubscribe: () => {
          const idx = this.#subscribers.indexOf(callback);
          if (idx > -1) this.#subscribers.splice(idx, 1);
        }};
      }
    };
  }

  destroy() {
    this.#subscribers = [];
  }
}

export class UmbArrayState {
  #value;
  #subscribers = [];

  constructor(initialValue) {
    this.#value = initialValue || [];
  }

  getValue() {
    return this.#value;
  }

  setValue(value) {
    this.#value = value;
    this.#subscribers.forEach(cb => cb(value));
  }

  asObservable() {
    return {
      subscribe: (callback) => {
        this.#subscribers.push(callback);
        callback(this.#value);
        return { unsubscribe: () => {
          const idx = this.#subscribers.indexOf(callback);
          if (idx > -1) this.#subscribers.splice(idx, 1);
        }};
      }
    };
  }

  destroy() {
    this.#subscribers = [];
  }
}
