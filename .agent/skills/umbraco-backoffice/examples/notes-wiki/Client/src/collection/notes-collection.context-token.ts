/**
 * Notes Collection Context Token
 *
 * Context token for accessing the notes collection context.
 */

import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import type { NotesCollectionContext } from "./notes-collection.context.js";

export const NOTES_COLLECTION_CONTEXT = new UmbContextToken<NotesCollectionContext>("NotesCollectionContext");
