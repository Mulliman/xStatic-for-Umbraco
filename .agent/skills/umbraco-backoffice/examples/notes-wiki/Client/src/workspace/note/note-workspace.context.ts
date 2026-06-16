/**
 * @fileoverview Note Workspace Context
 *
 * The workspace context is the central coordinator for note editing operations.
 * It manages state, handles API communication, and provides reactive data
 * for UI components to bind to.
 *
 * **Workspace Context Pattern:**
 *
 * In Umbraco, workspaces follow a pattern where:
 * 1. **Context** - Manages state and business logic (this file)
 * 2. **Editor Element** - Renders the workspace chrome (header, footer)
 * 3. **View Elements** - Render content within workspace tabs
 *
 * ```
 * Workspace Context (state + logic)
 *         │
 *         ├─── Editor Element (chrome)
 *         │         │
 *         │         └─── Workspace Views (content tabs)
 *         │
 *         └─── Provided via UMB_WORKSPACE_CONTEXT
 * ```
 *
 * **Key Responsibilities:**
 *
 * 1. **State Management**: Observable properties for reactive UI
 * 2. **Data Loading**: Fetch note from API when workspace opens
 * 3. **Data Saving**: Submit changes to API when Save is clicked
 * 4. **Routing**: Define URL patterns for edit/create modes
 * 5. **Tree Updates**: Notify tree to refresh after changes
 *
 * **IMPORTANT: UmbSubmittableWorkspaceContextBase**
 *
 * This context extends `UmbSubmittableWorkspaceContextBase` which:
 * - Enables the Save button in the workspace
 * - Provides `requestSubmit()` method for workspace actions
 * - Tracks dirty state automatically
 * - Manages the `isNew` flag for create vs edit mode
 *
 * Without extending this base class, the Save button won't appear!
 *
 * Skills demonstrated: umbraco-workspace, umbraco-context-api, umbraco-state-management
 */

import { NOTES_NOTE_WORKSPACE_ALIAS } from "../constants.js";
import { NoteWorkspaceEditorElement } from "./note-workspace-editor.element.js";
import {
  UmbSubmittableWorkspaceContextBase,
  UmbWorkspaceIsNewRedirectController,
} from "@umbraco-cms/backoffice/workspace";
import { UmbStringState, UmbArrayState } from "@umbraco-cms/backoffice/observable-api";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { NOTES_NOTE_ENTITY_TYPE, NOTES_FOLDER_ENTITY_TYPE, NOTES_ROOT_ENTITY_TYPE } from "../../constants.js";
import { NoteswikiService } from "../../api/index.js";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { UMB_ACTION_EVENT_CONTEXT } from "@umbraco-cms/backoffice/action";
import { UmbRequestReloadChildrenOfEntityEvent } from "@umbraco-cms/backoffice/entity-action";

/**
 * Data model for note content in the workspace.
 *
 * This interface represents the shape of note data as managed by the
 * workspace context. It's used for type safety when getting/setting data.
 */
export interface NoteWorkspaceData {
  /** Unique identifier (GUID) for the note */
  unique: string;
  /** Note title displayed in the header and tree */
  title: string;
  /** Markdown content of the note */
  content: string;
  /** Tags for categorization */
  tags: string[];
  /** Parent folder ID, or null if at root */
  parentUnique: string | null;
}

/**
 * Workspace context for editing notes.
 *
 * This is the brain of the note workspace. It:
 * - Manages all note data as observable state
 * - Handles loading and saving via the API
 * - Defines workspace routes for edit/create modes
 * - Notifies users of success/failure via toasts
 * - Triggers tree updates after saves
 *
 * **Observable State Pattern:**
 *
 * Each property uses Umbraco's `UmbStringState` or `UmbArrayState` which:
 * - Stores the current value
 * - Provides an RxJS observable for reactive updates
 * - Enables UI components to subscribe to changes
 *
 * ```typescript
 * // Private state (mutable)
 * #title = new UmbStringState("");
 *
 * // Public observable (read-only subscription)
 * readonly title = this.#title.asObservable();
 *
 * // Components subscribe:
 * this.observe(context.title, (title) => this._title = title);
 * ```
 *
 * **Routing:**
 *
 * The context defines two routes:
 * - `edit/:unique` - Edit an existing note
 * - `create/parent/:parentEntityType/:parentUnique` - Create a new note
 *
 * @extends UmbSubmittableWorkspaceContextBase<NoteWorkspaceData>
 *
 * @example
 * // Consuming the context in a view component
 * this.consumeContext(NOTE_WORKSPACE_CONTEXT, (context) => {
 *   // Subscribe to title changes
 *   this.observe(context.title, (title) => {
 *     this._title = title;
 *   });
 *
 *   // Update the title
 *   context.setTitle("New Title");
 * });
 */
export class NoteWorkspaceContext extends UmbSubmittableWorkspaceContextBase<NoteWorkspaceData> {
  // ===========================================================================
  // OBSERVABLE STATE
  // Private state objects with public observables for reactive UI binding
  // ===========================================================================

  /** Private state for unique ID */
  #unique = new UmbStringState(undefined);
  /** Observable unique ID - subscribe to track the current note */
  readonly unique = this.#unique.asObservable();

  /** Private state for title */
  #title = new UmbStringState("");
  /** Observable title - subscribe to display/edit the note title */
  readonly title = this.#title.asObservable();

  /** Private state for content */
  #content = new UmbStringState("");
  /** Observable content - subscribe to display/edit markdown content */
  readonly content = this.#content.asObservable();

  /** Private state for tags array */
  #tags = new UmbArrayState<string>([], (x) => x);
  /** Observable tags - subscribe to display/edit tags list */
  readonly tags = this.#tags.asObservable();

  /** Private state for icon */
  #icon = new UmbStringState("icon-notepad");
  /** Observable icon - subscribe for header display */
  readonly icon = this.#icon.asObservable();

  /** Private state for parent folder ID */
  #parentUnique = new UmbStringState(undefined);
  /** Observable parent ID - null means root level */
  readonly parentUnique = this.#parentUnique.asObservable();

  // ===========================================================================
  // METADATA STATE (Read-only - set by API, not editable by user)
  // ===========================================================================

  /** Private state for creation date */
  #createdDate = new UmbStringState(undefined);
  /** Observable creation date (ISO 8601 string) */
  readonly createdDate = this.#createdDate.asObservable();

  /** Private state for modification date */
  #modifiedDate = new UmbStringState(undefined);
  /** Observable modification date (ISO 8601 string) */
  readonly modifiedDate = this.#modifiedDate.asObservable();

  /** Private state for creator username */
  #createdBy = new UmbStringState(undefined);
  /** Observable creator username */
  readonly createdBy = this.#createdBy.asObservable();

  /** Private state for last modifier username */
  #modifiedBy = new UmbStringState(undefined);
  /** Observable last modifier username */
  readonly modifiedBy = this.#modifiedBy.asObservable();

  // ===========================================================================
  // CONSUMED CONTEXTS
  // ===========================================================================

  /** Notification context for displaying toast messages */
  #notificationContext?: typeof UMB_NOTIFICATION_CONTEXT.TYPE;

  /**
   * Creates a new note workspace context.
   *
   * Sets up:
   * - Route definitions for edit/create modes
   * - Notification context consumption for toasts
   *
   * **Important:** Do NOT call `provideContext` here.
   * `UmbSubmittableWorkspaceContextBase` already provides `UMB_WORKSPACE_CONTEXT`.
   * Our `NOTE_WORKSPACE_CONTEXT` token uses "UmbWorkspaceContext" as its alias,
   * which matches the base class provision.
   *
   * @param {UmbControllerHost} host - The controller host (typically the workspace element)
   */
  constructor(host: UmbControllerHost) {
    super(host, NOTES_NOTE_WORKSPACE_ALIAS);

    // NOTE: Do NOT call provideContext here - UmbSubmittableWorkspaceContextBase
    // already provides UMB_WORKSPACE_CONTEXT. The NOTE_WORKSPACE_CONTEXT token
    // uses "UmbWorkspaceContext" as its alias which matches the base class provision.

    // Consume notification context for success/error toast messages
    this.consumeContext(UMB_NOTIFICATION_CONTEXT, (context) => {
      this.#notificationContext = context;
    });

    // Define workspace routes
    // These determine what component renders based on the URL
    this.routes.setRoutes([
      {
        // Route: Edit an existing note
        // URL: /section/notes/workspace/notes-note/edit/{guid}
        path: "edit/:unique",
        component: NoteWorkspaceEditorElement,
        setup: (_component, info) => {
          const unique = info.match.params.unique;
          this.load(unique);
        },
      },
      {
        // Route: Create a new note
        // URL: /section/notes/workspace/notes-note/create/parent/{parentEntityType}/{parentId}
        path: "create/parent/:parentEntityType/:parentUnique",
        component: NoteWorkspaceEditorElement,
        setup: (_component, info) => {
          const parentUnique =
            info.match.params.parentUnique === "null"
              ? null
              : info.match.params.parentUnique;
          this.createScaffold(parentUnique);

          // After saving a new note, redirect from /create to /edit URL
          // This prevents issues with the browser back button
          new UmbWorkspaceIsNewRedirectController(
            this,
            this,
            this.getHostElement().shadowRoot!.querySelector("umb-router-slot")!
          );
        },
      },
    ]);
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================

  /**
   * Loads an existing note from the API.
   *
   * Called by the edit route when the workspace opens.
   * Fetches note data and populates all state properties.
   *
   * @param {string} unique - The unique ID (GUID) of the note to load
   *
   * @example
   * // Called automatically by route setup, but can be called manually:
   * await context.load("abc-123-def-456");
   */
  async load(unique: string) {
    this.#unique.setValue(unique);
    this.setIsNew(false);

    try {
      const response = await NoteswikiService.getNote({
        path: { id: unique },
      });

      const data = response.data;
      this.#title.setValue(data.title);
      this.#content.setValue(data.content);
      this.#tags.setValue(data.tags || []);
      this.#parentUnique.setValue(data.parentUnique ?? undefined);
      this.#createdDate.setValue(data.createdDate);
      this.#modifiedDate.setValue(data.modifiedDate);
      this.#createdBy.setValue(data.createdBy);
      this.#modifiedBy.setValue(data.modifiedBy);
    } catch (error) {
      console.error("Error loading note:", error);
      // Set default values on error so UI doesn't break
      this.#title.setValue("Error loading note");
    }
  }

  /**
   * Creates a scaffold for a new note.
   *
   * Called by the create route when creating a new note.
   * Generates a new unique ID and initializes all state to defaults.
   *
   * @param {string | null} parentUnique - Parent folder ID, or null for root level
   *
   * @example
   * // Create note in folder
   * context.createScaffold("folder-abc-123");
   *
   * // Create note at root
   * context.createScaffold(null);
   */
  createScaffold(parentUnique: string | null) {
    // Generate a new UUID for the note
    const newUnique = crypto.randomUUID();
    this.#unique.setValue(newUnique);
    this.setIsNew(true);
    this.#parentUnique.setValue(parentUnique ?? undefined);

    // Initialize editable fields to empty
    this.#title.setValue("");
    this.#content.setValue("");
    this.#tags.setValue([]);

    // Clear metadata (will be set by server on save)
    this.#createdDate.setValue(undefined);
    this.#modifiedDate.setValue(undefined);
    this.#createdBy.setValue(undefined);
    this.#modifiedBy.setValue(undefined);
  }

  // ===========================================================================
  // DATA SAVING
  // ===========================================================================

  /**
   * Saves the note to the API.
   *
   * **IMPORTANT:** This is the `submit` method required by `UmbSubmittableWorkspaceContextBase`.
   * It's called automatically when the user clicks the Save button in the workspace header.
   *
   * The method:
   * 1. Validates that we have a unique ID
   * 2. Creates or updates the note via API
   * 3. Shows success/error notification
   * 4. Triggers tree refresh to show new/updated item
   *
   * @returns {Promise<void>} Resolves on success, throws on failure
   * @throws {Error} If unique ID is missing or API call fails
   *
   * @protected - Called by base class, not directly by consumers
   */
  protected async submit(): Promise<void> {
    const unique = this.#unique.getValue();
    const isNew = this.getIsNew();

    if (!unique) {
      throw new Error("Cannot save: no unique identifier");
    }

    try {
      if (isNew) {
        await NoteswikiService.createNote({
          body: {
            unique,
            parentUnique: this.#parentUnique.getValue() || null,
            title: this.#title.getValue(),
            content: this.#content.getValue(),
            tags: this.#tags.getValue(),
          },
        });
      } else {
        await NoteswikiService.updateNote({
          path: { id: unique },
          body: {
            title: this.#title.getValue(),
            content: this.#content.getValue(),
            tags: this.#tags.getValue(),
          },
        });
      }

      this.setIsNew(false);

      // Show success notification
      this.#notificationContext?.peek("positive", {
        data: {
          headline: "Note saved",
          message: `"${this.#title.getValue()}" has been saved successfully.`,
        },
      });

      // Request tree to reload the parent's children
      const eventContext = await this.getContext(UMB_ACTION_EVENT_CONTEXT);
      if (eventContext) {
        const parentUnique = this.#parentUnique.getValue();
        const event = new UmbRequestReloadChildrenOfEntityEvent({
          entityType: parentUnique ? NOTES_FOLDER_ENTITY_TYPE : NOTES_ROOT_ENTITY_TYPE,
          unique: parentUnique ?? null,
        });
        eventContext.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Error saving note:", error);

      // Show error notification
      this.#notificationContext?.peek("danger", {
        data: {
          headline: "Error saving note",
          message: "An error occurred while saving the note. Please try again.",
        },
      });

      throw error; // Re-throw so workspace action knows it failed
    }
  }

  // ===========================================================================
  // GETTERS - Required by UmbSubmittableWorkspaceContextBase
  // These methods are called by the base class and workspace system
  // ===========================================================================

  /**
   * Gets the unique identifier of the current note.
   *
   * Required by `UmbSubmittableWorkspaceContextBase`.
   *
   * @returns {string | undefined} The note's unique ID, or undefined if not set
   */
  getUnique() {
    return this.#unique.getValue();
  }

  /**
   * Gets the entity type for this workspace.
   *
   * Required by `UmbSubmittableWorkspaceContextBase`.
   * Used by the system to identify what type of content this workspace edits.
   *
   * @returns {string} Always returns NOTES_NOTE_ENTITY_TYPE ("notes-note")
   */
  getEntityType() {
    return NOTES_NOTE_ENTITY_TYPE;
  }

  /**
   * Gets the current note data as a single object.
   *
   * Required by `UmbSubmittableWorkspaceContextBase`.
   * Returns all editable fields in a single object format.
   *
   * @returns {NoteWorkspaceData | undefined} The note data, or undefined if no note loaded
   */
  getData(): NoteWorkspaceData | undefined {
    const unique = this.#unique.getValue();
    if (!unique) return undefined;

    return {
      unique,
      title: this.#title.getValue(),
      content: this.#content.getValue(),
      tags: this.#tags.getValue(),
      parentUnique: this.#parentUnique.getValue() || null,
    };
  }

  // ===========================================================================
  // SETTERS - Used by UI components to update state
  // These methods update the private state, triggering observable updates
  // ===========================================================================

  /**
   * Sets the note title.
   *
   * @param {string} title - The new title
   *
   * @example
   * // In a form component:
   * context.setTitle(inputElement.value);
   */
  setTitle(title: string) {
    this.#title.setValue(title);
  }

  /**
   * Sets the note content (markdown).
   *
   * @param {string} content - The new markdown content
   */
  setContent(content: string) {
    this.#content.setValue(content);
  }

  /**
   * Replaces all tags with a new array.
   *
   * @param {string[]} tags - The new tags array
   */
  setTags(tags: string[]) {
    this.#tags.setValue(tags);
  }

  /**
   * Adds a single tag if it doesn't already exist.
   *
   * @param {string} tag - The tag to add
   *
   * @example
   * context.addTag("important");
   * context.addTag("important"); // No duplicate added
   */
  addTag(tag: string) {
    const currentTags = this.#tags.getValue();
    if (!currentTags.includes(tag)) {
      this.#tags.setValue([...currentTags, tag]);
    }
  }

  /**
   * Removes a tag from the list.
   *
   * @param {string} tag - The tag to remove
   */
  removeTag(tag: string) {
    const currentTags = this.#tags.getValue();
    this.#tags.setValue(currentTags.filter((t) => t !== tag));
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  /**
   * Cleans up all state objects when the context is destroyed.
   *
   * Called automatically when the workspace closes.
   * Important for memory management - state objects must be destroyed
   * to prevent memory leaks from lingering subscriptions.
   *
   * @override
   */
  override destroy() {
    // Destroy all state objects to clean up subscriptions
    this.#unique.destroy();
    this.#title.destroy();
    this.#content.destroy();
    this.#tags.destroy();
    this.#icon.destroy();
    this.#parentUnique.destroy();
    this.#createdDate.destroy();
    this.#modifiedDate.destroy();
    this.#createdBy.destroy();
    this.#modifiedBy.destroy();

    // Call parent destroy for base class cleanup
    super.destroy();
  }
}

/**
 * Export the context class as `api` for Umbraco's extension loader.
 *
 * When the workspace manifest specifies `api: () => import("./note-workspace.context.js")`,
 * Umbraco looks for the `api` export to instantiate the context.
 */
export { NoteWorkspaceContext as api };
