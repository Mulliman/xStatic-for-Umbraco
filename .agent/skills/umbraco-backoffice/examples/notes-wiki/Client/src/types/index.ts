/**
 * @fileoverview Notes Wiki Types
 *
 * Central type definitions for the Notes Wiki extension.
 * These TypeScript interfaces match the C# models on the server side.
 *
 * **Organization:**
 * - Domain types (Note, Folder) are defined here
 * - Tree types are re-exported from `tree/types.ts`
 * - API types are auto-generated in `api/types.gen.ts`
 *
 * @example
 * import type { NoteModel, NotesTreeItemModel } from "../types/index.js";
 *
 * Skills demonstrated: TypeScript interfaces, module organization
 */

import {
  NOTES_FOLDER_ENTITY_TYPE,
  NOTES_NOTE_ENTITY_TYPE,
} from "../constants.js";

// =============================================================================
// RE-EXPORTS
// Tree types live with tree code, re-exported here for convenience
// =============================================================================

export type { NotesTreeItemModel, NotesTreeRootModel } from "../tree/types.js";

// =============================================================================
// BASE INTERFACES
// =============================================================================

/**
 * Base interface for all Notes entities.
 *
 * All notes and folders share these common properties.
 * Extend this interface for specific entity types.
 */
export interface NotesEntityBase {
  /** Unique identifier (GUID) for the entity */
  unique: string;
  /** Parent folder ID, or null if at root level */
  parentUnique: string | null;
  /** ISO 8601 date string when the entity was created */
  createdDate: string;
}

// =============================================================================
// NOTE MODEL
// =============================================================================

/**
 * Note model - represents an individual note.
 *
 * Notes are the primary content items in the Notes Wiki.
 * They contain markdown content and can be tagged for organization.
 */
export interface NoteModel extends NotesEntityBase {
  /** Entity type discriminator for type guards */
  entityType: typeof NOTES_NOTE_ENTITY_TYPE;
  /** Note title displayed in tree and workspace */
  title: string;
  /** Markdown content of the note */
  content: string;
  /** Tags for categorization and filtering */
  tags: string[];
  /** ISO 8601 date string when the note was last modified */
  modifiedDate: string;
  /** Username who created the note */
  createdBy: string;
  /** Username who last modified the note */
  modifiedBy: string;
}

/**
 * Detail model for the note workspace context.
 *
 * This is the shape used by the workspace context when loading
 * and saving notes. Matches the API response structure.
 */
export interface NoteDetailModel {
  unique: string;
  entityType: typeof NOTES_NOTE_ENTITY_TYPE;
  parentUnique: string | null;
  title: string;
  content: string;
  tags: string[];
  createdDate: string;
  modifiedDate: string;
  createdBy: string;
  modifiedBy: string;
}

// =============================================================================
// FOLDER MODEL
// =============================================================================

/**
 * Folder model - represents a folder containing notes.
 *
 * Folders organize notes into a hierarchical structure.
 * They can contain both notes and other folders.
 */
export interface FolderModel extends NotesEntityBase {
  /** Entity type discriminator for type guards */
  entityType: typeof NOTES_FOLDER_ENTITY_TYPE;
  /** Folder name displayed in tree */
  name: string;
}

/**
 * Detail model for the folder workspace context.
 */
export interface FolderDetailModel {
  unique: string;
  entityType: typeof NOTES_FOLDER_ENTITY_TYPE;
  parentUnique: string | null;
  name: string;
  createdDate: string;
}

// =============================================================================
// API RESPONSE MODEL
// Used for tree item API responses before transformation
// =============================================================================

/**
 * API response model for tree items.
 *
 * This matches the JSON structure returned by the tree API endpoint.
 * The tree data source transforms this into `NotesTreeItemModel`.
 */
export interface NotesTreeItemResponseModel {
  /** Unique identifier */
  id: string;
  /** Display name (title for notes, name for folders) */
  name: string;
  /** Entity type string */
  entityType: string;
  /** Whether this item has child items */
  hasChildren: boolean;
  /** Whether this is a folder (vs a note) */
  isFolder: boolean;
  /** Icon name for display */
  icon: string;
  /** Parent item ID, null if at root */
  parentId: string | null;
}

// =============================================================================
// API REQUEST/RESPONSE MODELS
// =============================================================================

/**
 * Create note request
 */
export interface CreateNoteRequest {
  parentUnique: string | null;
  title: string;
  content?: string;
  tags?: string[];
}

/**
 * Update note request
 */
export interface UpdateNoteRequest {
  title: string;
  content: string;
  tags: string[];
}

/**
 * Create folder request
 */
export interface CreateFolderRequest {
  parentUnique: string | null;
  name: string;
}

/**
 * Update folder request
 */
export interface UpdateFolderRequest {
  name: string;
}

/**
 * Recent notes response
 */
export interface RecentNotesResponse {
  notes: NoteModel[];
}

/**
 * Search results response
 */
export interface SearchResultsResponse {
  results: NoteModel[];
  totalCount: number;
}
