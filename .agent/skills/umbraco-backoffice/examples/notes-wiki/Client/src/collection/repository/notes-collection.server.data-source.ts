/**
 * Notes Collection Server Data Source
 *
 * Fetches collection data from the API.
 * Skills used: umbraco-repository-pattern
 */

import type { NotesCollectionFilterModel, NotesCollectionItemModel } from "../types.js";
import { NoteswikiService } from "../../api/index.js";
import { NOTES_NOTE_ENTITY_TYPE, NOTES_FOLDER_ENTITY_TYPE } from "../../constants.js";

export class NotesCollectionServerDataSource {
  constructor() {}


  async getCollection(filter: NotesCollectionFilterModel): Promise<{
    data?: { items: NotesCollectionItemModel[]; total: number };
    error?: Error;
  }> {
    try {
      // If searching, use the search endpoint
      if (filter.filter?.trim()) {
        const response = await NoteswikiService.searchNotes({
          query: { q: filter.filter },
        });

        const items: NotesCollectionItemModel[] = response.data.results.map((note) => ({
          unique: note.unique,
          entityType: NOTES_NOTE_ENTITY_TYPE,
          name: note.title || "Untitled",
          icon: "icon-notepad",
          isFolder: false,
          modifiedDate: note.modifiedDate,
        }));

        return {
          data: {
            items,
            total: response.data.totalCount,
          },
        };
      }

      // Otherwise, get tree children (root or folder)
      let response;
      if (!filter.parentUnique) {
        response = await NoteswikiService.getRoot({
          query: {
            skip: filter.skip ?? 0,
            take: filter.take ?? 50,
          },
        });
      } else {
        response = await NoteswikiService.getChildren({
          path: { parentId: filter.parentUnique },
          query: {
            skip: filter.skip ?? 0,
            take: filter.take ?? 50,
          },
        });
      }

      const items: NotesCollectionItemModel[] = response.data.items.map((item) => ({
        unique: item.id,
        entityType: item.isFolder ? NOTES_FOLDER_ENTITY_TYPE : NOTES_NOTE_ENTITY_TYPE,
        name: item.name,
        icon: item.icon,
        isFolder: item.isFolder,
      }));

      return {
        data: {
          items,
          total: response.data.total,
        },
      };
    } catch (error) {
      console.error("Error fetching collection:", error);
      return { error: error as Error };
    }
  }
}
