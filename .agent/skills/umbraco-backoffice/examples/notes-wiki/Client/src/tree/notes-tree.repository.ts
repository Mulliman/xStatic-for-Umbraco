/**
 * @fileoverview Notes Tree Repository
 *
 * The repository is the main interface for tree data operations in the
 * Umbraco backoffice. It implements the Repository Pattern with an
 * inline data source for simplicity.
 *
 * **Architecture Overview:**
 *
 * ```
 * Tree UI ─────> Repository (with inline data source) ─────> API
 * ```
 *
 * **Repository Pattern Benefits:**
 *
 * 1. **Abstraction**: Tree UI doesn't know about API details
 * 2. **Testability**: Easy to mock for unit tests
 * 3. **Consistency**: Standard Umbraco tree operations
 * 4. **Simplicity**: Everything in one file
 *
 * **Registration:**
 *
 * The repository is registered via manifest and referenced by the tree:
 *
 * ```typescript
 * // In tree manifest
 * {
 *   type: "tree",
 *   meta: {
 *     repositoryAlias: NOTES_TREE_REPOSITORY_ALIAS,
 *   },
 * }
 *
 * // Repository manifest
 * {
 *   type: "repository",
 *   alias: NOTES_TREE_REPOSITORY_ALIAS,
 *   api: () => import("./notes-tree.repository.js"),
 * }
 * ```
 *
 * Skills demonstrated: umbraco-repository-pattern, umbraco-tree
 */

import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import type { UmbApi } from "@umbraco-cms/backoffice/extension-api";
import {
  UmbTreeRepositoryBase,
  UmbTreeServerDataSourceBase,
  type UmbTreeAncestorsOfRequestArgs,
  type UmbTreeChildrenOfRequestArgs,
  type UmbTreeRootItemsRequestArgs,
} from "@umbraco-cms/backoffice/tree";
import {
  NOTES_ROOT_ENTITY_TYPE,
  NOTES_FOLDER_ENTITY_TYPE,
  NOTES_NOTE_ENTITY_TYPE,
} from "../constants.js";
import type { NotesTreeItemModel, NotesTreeRootModel } from "./types.js";
import type { TreeItemModel } from "../api/index.js";
import { NoteswikiService } from "../api/index.js";

/**
 * Data source for the Notes tree - inlined in repository file for simplicity.
 * Uses UmbTreeServerDataSourceBase with function parameters.
 *
 * Handles fetching tree data from the C# backend API using the generated
 * OpenAPI client (hey-api) for type-safe API calls.
 */
class NotesTreeDataSource extends UmbTreeServerDataSourceBase<
  TreeItemModel,
  NotesTreeItemModel
> {
  constructor(host: UmbControllerHost) {
    super(host, {
      getRootItems: async (args: UmbTreeRootItemsRequestArgs) => {
        const response = await NoteswikiService.getRoot({
          query: { skip: args.skip, take: args.take },
        });

        return {
          data: {
            items: response.data.items,
            total: response.data.total,
          },
        };
      },
      getChildrenOf: async (args: UmbTreeChildrenOfRequestArgs) => {
        // If parent is null, we're requesting root items
        if (args.parent?.unique === null) {
          const response = await NoteswikiService.getRoot({
            query: { skip: args.skip, take: args.take },
          });
          return {
            data: {
              items: response.data.items,
              total: response.data.total,
            },
          };
        }

        const response = await NoteswikiService.getChildren({
          path: { parentId: args.parent.unique },
          query: { skip: args.skip, take: args.take },
        });

        return {
          data: {
            items: response.data.items,
            total: response.data.total,
          },
        };
      },
      getAncestorsOf: async (args: UmbTreeAncestorsOfRequestArgs) => {
        const response = await NoteswikiService.getAncestors({
          path: { id: args.treeItem.unique },
        });

        return { data: response.data };
      },
      mapper: (item: TreeItemModel): NotesTreeItemModel => {
        // Determine entity type based on API response
        // This is CRITICAL - it controls which workspace opens on click
        let entityType: typeof NOTES_FOLDER_ENTITY_TYPE | typeof NOTES_NOTE_ENTITY_TYPE;

        if (item.isFolder || item.entityType === "notes-folder") {
          entityType = NOTES_FOLDER_ENTITY_TYPE;
        } else {
          entityType = NOTES_NOTE_ENTITY_TYPE;
        }

        return {
          unique: item.id,
          parent: {
            unique: item.parentId || null,
            // Infer parent entity type: if no parentId, parent is root
            entityType: item.parentId ? NOTES_FOLDER_ENTITY_TYPE : NOTES_ROOT_ENTITY_TYPE,
          },
          name: item.name,
          entityType: entityType,
          hasChildren: item.hasChildren,
          isFolder: item.isFolder,
          icon: item.icon || (item.isFolder ? "icon-folder" : "icon-notepad"),
        };
      },
    });
  }
}

/**
 * Repository for Notes tree operations.
 *
 * Extends `UmbTreeRepositoryBase` which provides standard tree operations:
 * - `requestRootTreeItems()` - Get items at the root level
 * - `requestTreeItemsOf(parent)` - Get children of a parent item
 * - `requestTreeRoot()` - Get the virtual root model
 *
 * **Type Parameters:**
 * - `NotesTreeItemModel` - The shape of tree items (notes and folders)
 * - `NotesTreeRootModel` - The shape of the tree root
 *
 * @implements {UmbApi} - Required for Umbraco extension registration
 *
 * @example
 * // The repository is typically consumed via context in a component:
 * const repository = await this.getContext(NOTES_TREE_REPOSITORY_CONTEXT);
 * const { data } = await repository.requestRootTreeItems();
 * console.log(data); // Array of NotesTreeItemModel
 */
export class NotesTreeRepository
  extends UmbTreeRepositoryBase<NotesTreeItemModel, NotesTreeRootModel>
  implements UmbApi
{
  /**
   * Creates a new Notes tree repository with inline data source.
   *
   * @param {UmbControllerHost} host - The controller host for context consumption.
   */
  constructor(host: UmbControllerHost) {
    super(host, NotesTreeDataSource);
  }

  /**
   * Returns the root model for the tree.
   *
   * The tree root is a virtual item that represents the top of the hierarchy.
   * It's displayed when `hideTreeRoot: false` in the tree manifest.
   *
   * **Why is this needed?**
   *
   * Unlike regular tree items that come from the API, the root is synthetic.
   * It provides:
   * - A consistent top-level item for navigation
   * - A target for "Create at root" actions
   * - An entity type for root-level entity actions
   *
   * @returns {Promise<{data: NotesTreeRootModel}>} The tree root model
   *
   * @example
   * const { data: root } = await repository.requestTreeRoot();
   * console.log(root.entityType); // "notes-root"
   * console.log(root.name);       // "Notes"
   */
  async requestTreeRoot() {
    const data: NotesTreeRootModel = {
      unique: null,
      entityType: NOTES_ROOT_ENTITY_TYPE,
      name: "Notes",
      icon: "icon-notepad",
      hasChildren: true,
      isFolder: true,
    };

    return { data };
  }
}

/**
 * Export the repository class as `api` for Umbraco's extension loader.
 *
 * When the manifest specifies `api: () => import("./notes-tree.repository.js")`,
 * Umbraco looks for the `api` export to instantiate the repository.
 */
export { NotesTreeRepository as api };
