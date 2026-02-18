import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import type { UmbApi } from '@umbraco-cms/backoffice/extension-api';
import { UmbTreeRepositoryBase } from '@umbraco-cms/backoffice/tree';

// Import from original src files
import {
  OUR_TREE_ROOT_ENTITY_TYPE,
  OUR_TREE_ITEM_ENTITY_TYPE,
  type OurTreeItemModel,
  type OurTreeRootModel,
} from '../../../src/settingsTree/types.js';

// Import mock data
import { rootItems, childrenByParent, type MockTreeItem } from './mock-data.js';

/**
 * Mock data source that returns mock data directly without API calls.
 */
class MockTreeDataSource {
  constructor(_host: UmbControllerHost) {
    // Host not needed for mock data source
  }

  async getRootItems(args: { skip: number; take: number }) {
    const items = rootItems.slice(args.skip, args.skip + args.take);
    return { data: { total: rootItems.length, items: this.#mapItems(items) } };
  }

  async getChildrenOf(args: { parent: { unique: string | null } }) {
    if (!args.parent?.unique) {
      return this.getRootItems({ skip: 0, take: 100 });
    }
    const children = childrenByParent[args.parent.unique] || [];
    return { data: { total: children.length, items: this.#mapItems(children) } };
  }

  async getAncestorsOf() {
    return { data: [] };
  }

  #mapItems(items: MockTreeItem[]): OurTreeItemModel[] {
    return items.map((item) => ({
      unique: item.id,
      parent: { unique: null, entityType: OUR_TREE_ROOT_ENTITY_TYPE },
      name: item.name,
      entityType: OUR_TREE_ITEM_ENTITY_TYPE,
      hasChildren: item.hasChildren,
      isFolder: false,
      icon: item.icon,
    }));
  }
}

/**
 * Mock repository that uses mock data instead of API calls.
 * This replaces the original OurTreeRepository when running in mock mode.
 */
export class MockTreeRepository
  extends UmbTreeRepositoryBase<OurTreeItemModel, OurTreeRootModel>
  implements UmbApi
{
  constructor(host: UmbControllerHost) {
    super(host, MockTreeDataSource);
  }

  async requestTreeRoot() {
    const data: OurTreeRootModel = {
      unique: null,
      entityType: OUR_TREE_ROOT_ENTITY_TYPE,
      name: 'Our Tree Root',
      icon: 'icon-star',
      hasChildren: true,
      isFolder: true,
    };

    return { data };
  }
}

export { MockTreeRepository as api };
