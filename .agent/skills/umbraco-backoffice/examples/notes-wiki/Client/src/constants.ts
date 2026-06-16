/**
 * @fileoverview Notes Wiki Constants Aggregator
 *
 * This file re-exports all constants from feature modules for convenient importing.
 * Instead of importing from individual feature directories, consumers can import
 * everything from this central location.
 *
 * The distributed constants pattern:
 * - Each feature directory has its own `constants.ts` with related constants
 * - This file aggregates them all for backward compatibility
 * - New code should import from feature-specific files when possible
 *
 * @example
 * // Import from central aggregator
 * import { NOTES_SECTION_ALIAS, NOTES_TREE_ALIAS } from "./constants.js";
 *
 * // Or import from specific feature (preferred for new code)
 * import { NOTES_SECTION_ALIAS } from "./section/constants.js";
 * import { NOTES_TREE_ALIAS } from "./tree/constants.js";
 *
 * Skills demonstrated: Code organization, module patterns
 */

// =============================================================================
// ENTITY TYPES
// The critical link between tree items and workspaces
// =============================================================================
export * from "./entity.js";

// =============================================================================
// SECTION & SIDEBAR
// Top-level navigation structure
// =============================================================================
export * from "./section/constants.js";

// =============================================================================
// MENU
// Sidebar menu organization
// =============================================================================
export * from "./menu/constants.js";

// =============================================================================
// DASHBOARD
// Summary views and quick actions
// =============================================================================
export * from "./dashboard/constants.js";

// =============================================================================
// TREE
// Hierarchical navigation system
// =============================================================================
export * from "./tree/constants.js";

// =============================================================================
// WORKSPACE
// Content editing interfaces
// =============================================================================
export * from "./workspace/constants.js";

// =============================================================================
// COLLECTION
// Grid/list views with filtering
// =============================================================================
export * from "./collection/constants.js";

// =============================================================================
// API CONFIGURATION
// Shared across all features, kept at root level
// =============================================================================

/**
 * Base path for the Notes Wiki API.
 *
 * All API requests are relative to this path.
 * The OpenAPI client uses this for request construction.
 *
 * @constant {string}
 */
export const NOTES_API_BASE_PATH = "/umbraco/notes/api/v1";
