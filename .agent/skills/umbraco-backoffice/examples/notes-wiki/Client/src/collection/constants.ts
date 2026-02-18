/**
 * @fileoverview Collection Constants
 *
 * Defines aliases for the Notes collection system.
 * Collections provide grid/list views of items with filtering and sorting.
 *
 * The collection system consists of:
 * 1. **Collection** - The main grid/list view component
 * 2. **Repository** - Handles data fetching and filtering
 * 3. **Views** - Different visual representations (grid, table)
 *
 * Skills demonstrated: umbraco-collection, umbraco-collection-view
 */

/**
 * Alias for the Notes collection.
 *
 * The collection displays notes and folders in a browseable grid view.
 * It supports filtering, sorting, and pagination.
 *
 * @constant {string}
 */
export const NOTES_COLLECTION_ALIAS = "Notes.Collection";

/**
 * Alias for the Notes collection repository.
 *
 * The repository fetches and filters collection items from the API.
 * It provides methods for loading items with various filters.
 *
 * @constant {string}
 */
export const NOTES_COLLECTION_REPOSITORY_ALIAS = "Notes.Collection.Repository";

/**
 * Alias for the Notes grid collection view.
 *
 * The grid view displays items as cards in a responsive grid.
 * Alternative views could include table or list layouts.
 *
 * @constant {string}
 */
export const NOTES_GRID_COLLECTION_VIEW_ALIAS = "Notes.Collection.View.Grid";
