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
  OUR_TREE_ROOT_ENTITY_TYPE,
  OUR_TREE_ITEM_ENTITY_TYPE,
  type OurTreeItemModel,
  type OurTreeRootModel,
} from "./types.js";
import type { OurTreeItemResponseModel } from "../api/index.js";
import { UmbTreeClientService } from "../api/index.js";

/**
 * Data source for the tree - inlined in repository file for simplicity.
 * Uses UmbTreeServerDataSourceBase with function parameters.
 */
class OurTreeDataSource extends UmbTreeServerDataSourceBase<
  OurTreeItemResponseModel,
  OurTreeItemModel
> {
  constructor(host: UmbControllerHost) {
    super(host, {
      getRootItems: async (args: UmbTreeRootItemsRequestArgs) =>
        await UmbTreeClientService.getRoot({
          query: { skip: args.skip, take: args.take },
        }),
      getChildrenOf: async (args: UmbTreeChildrenOfRequestArgs) => {
        if (args.parent?.unique === null) {
          return await UmbTreeClientService.getRoot({
            query: { skip: args.skip, take: args.take },
          });
        } else {
          return await UmbTreeClientService.getChildren({
            query: { parent: args.parent.unique },
          });
        }
      },
      getAncestorsOf: async (args: UmbTreeAncestorsOfRequestArgs) => {
        return await UmbTreeClientService.getAncestors({
          query: { id: args.treeItem.unique },
        });
      },
      mapper: (item: OurTreeItemResponseModel): OurTreeItemModel => {
        return {
          unique: item.id ?? "",
          parent: { unique: "", entityType: OUR_TREE_ROOT_ENTITY_TYPE },
          name: item.name ?? "unknown",
          entityType: OUR_TREE_ITEM_ENTITY_TYPE,
          hasChildren: item.hasChildren,
          isFolder: false,
          icon: item.icon ?? "icon-bug",
        };
      },
    });
  }
}

export class OurTreeRepository
  extends UmbTreeRepositoryBase<OurTreeItemModel, OurTreeRootModel>
  implements UmbApi
{
  constructor(host: UmbControllerHost) {
    super(host, OurTreeDataSource);
  }

  async requestTreeRoot() {
    const data: OurTreeRootModel = {
      unique: null,
      entityType: OUR_TREE_ROOT_ENTITY_TYPE,
      name: "Our Tree Root",
      icon: "icon-star",
      hasChildren: true,
      isFolder: true,
    };

    return { data };
  }
}

export { OurTreeRepository as api };
