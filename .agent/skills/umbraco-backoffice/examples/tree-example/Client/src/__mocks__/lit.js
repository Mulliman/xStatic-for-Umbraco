// Mock for @umbraco-cms/backoffice/external/lit
export const html = (strings, ...values) => ({ strings, values });
export const css = (strings, ...values) => ({ strings, values });
export const nothing = Symbol('nothing');
export const customElement = (name) => (target) => target;
export const state = () => (target, propertyKey) => {};
export const property = () => (target, propertyKey) => {};
