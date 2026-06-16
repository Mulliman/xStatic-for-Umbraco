/**
 * Collection Types
 *
 * Type definitions for the Notes collection system.
 */

export interface NotesCollectionItemModel {
  unique: string;
  entityType: string;
  name: string;
  icon: string;
  isFolder: boolean;
  modifiedDate?: string;
}

export interface NotesCollectionFilterModel {
  skip?: number;
  take?: number;
  filter?: string;
  parentUnique?: string | null;
}
