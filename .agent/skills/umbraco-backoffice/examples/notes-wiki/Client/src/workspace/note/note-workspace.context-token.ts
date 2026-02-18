/**
 * @fileoverview Note Workspace Context Token
 *
 * Defines the context token for dependency injection of the note workspace context.
 * This token enables components to consume the workspace context and access note data.
 *
 * **Why Use a Context Token?**
 *
 * Umbraco's backoffice uses a context-based dependency injection system.
 * Instead of importing singletons directly, components "consume" contexts
 * provided by parent components. This enables:
 *
 * - **Scoped instances**: Each workspace has its own context
 * - **Testability**: Easy to mock for unit tests
 * - **Loose coupling**: Components don't need direct imports
 *
 * **CRITICAL: The "UmbWorkspaceContext" Alias**
 *
 * The first argument to `UmbContextToken` MUST be `"UmbWorkspaceContext"` to match
 * Umbraco's built-in workspace context token. This is essential because:
 *
 * 1. **Workspace conditions**: The `workspaceAlias` condition uses this alias
 *    to find the active workspace and check its alias
 * 2. **Workspace views**: Views with conditions like `workspaceAlias === "..."`
 *    only appear when they can find a context with this exact alias
 * 3. **Workspace actions**: The Save button and other actions rely on this
 *
 * **Type Parameters:**
 *
 * ```typescript
 * UmbContextToken<BaseType, SpecificType>
 * ```
 *
 * - `UmbWorkspaceContext` - Base type (for compatibility)
 * - `NoteWorkspaceContext` - Specific type (for type safety)
 *
 * The discriminator function (third argument) narrows the type at runtime.
 *
 * @example
 * // In a component that needs the note context:
 * import { NOTE_WORKSPACE_CONTEXT } from "./note-workspace.context-token.js";
 *
 * class MyComponent extends UmbLitElement {
 *   constructor() {
 *     super();
 *     this.consumeContext(NOTE_WORKSPACE_CONTEXT, (context) => {
 *       // TypeScript knows this is NoteWorkspaceContext
 *       context.title.subscribe((title) => {
 *         console.log("Note title:", title);
 *       });
 *     });
 *   }
 * }
 *
 * Skills demonstrated: umbraco-context-api, umbraco-workspace
 */

import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import type { UmbWorkspaceContext } from "@umbraco-cms/backoffice/workspace";
import type { NoteWorkspaceContext } from "./note-workspace.context.js";
import { NOTES_NOTE_ENTITY_TYPE } from "../../constants.js";

/**
 * Context token for consuming the note workspace context.
 *
 * **Usage:**
 *
 * ```typescript
 * this.consumeContext(NOTE_WORKSPACE_CONTEXT, (context) => {
 *   // Access note data and methods
 *   context.title.subscribe((title) => this._title = title);
 *   context.setTitle("New Title");
 * });
 * ```
 *
 * **Discriminator Function:**
 *
 * The third argument is a type guard that distinguishes this workspace from others.
 * When multiple workspaces are in the component tree, the discriminator ensures
 * we get the correct one (a note workspace, not a folder workspace).
 *
 * @type {UmbContextToken<UmbWorkspaceContext, NoteWorkspaceContext>}
 */
export const NOTE_WORKSPACE_CONTEXT = new UmbContextToken<
  UmbWorkspaceContext,
  NoteWorkspaceContext
>(
  // CRITICAL: Must be "UmbWorkspaceContext" for workspace conditions to work
  // This matches Umbraco's UMB_WORKSPACE_CONTEXT token alias
  "UmbWorkspaceContext",

  // Default value (undefined means no default - will wait for context)
  undefined,

  // Discriminator: Type guard to identify this specific workspace type
  // Returns true only if the context is for a note entity
  (context): context is NoteWorkspaceContext =>
    context.getEntityType?.() === NOTES_NOTE_ENTITY_TYPE
);
