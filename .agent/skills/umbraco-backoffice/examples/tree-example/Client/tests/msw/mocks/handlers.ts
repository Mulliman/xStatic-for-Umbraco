/**
 * Re-export MSW handlers from the extension's src/msw directory.
 * The handlers are defined in src/msw/handlers.ts and registered by the
 * extension's index.ts when VITE_UMBRACO_USE_MSW=on is set.
 */
export { createHandlers } from '../../../src/msw/handlers.js';
