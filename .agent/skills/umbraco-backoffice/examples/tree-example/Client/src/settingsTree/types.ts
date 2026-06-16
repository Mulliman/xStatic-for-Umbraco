import {
  UmbTreeItemModel,
  UmbTreeRootModel,
} from "@umbraco-cms/backoffice/tree";

export const OUR_TREE_ROOT_ENTITY_TYPE = "our-tree-root";
export const OUR_TREE_ITEM_ENTITY_TYPE = "our-tree-item";

export interface OurTreeItemModel extends UmbTreeItemModel {
  entityType: typeof OUR_TREE_ITEM_ENTITY_TYPE;
}

export interface OurTreeRootModel extends UmbTreeRootModel {
  entityType: typeof OUR_TREE_ROOT_ENTITY_TYPE;
}
