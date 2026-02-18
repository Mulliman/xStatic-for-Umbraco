import { expect } from '@open-wc/testing';
import { OUR_TREE_ROOT_ENTITY_TYPE, OUR_TREE_ITEM_ENTITY_TYPE } from './types.js';

describe('OurTree Types', () => {
  describe('Entity Type Constants', () => {
    it('should define root entity type', () => {
      expect(OUR_TREE_ROOT_ENTITY_TYPE).to.equal('our-tree-root');
    });

    it('should define item entity type', () => {
      expect(OUR_TREE_ITEM_ENTITY_TYPE).to.equal('our-tree-item');
    });

    it('should have distinct entity types', () => {
      expect(OUR_TREE_ROOT_ENTITY_TYPE).to.not.equal(OUR_TREE_ITEM_ENTITY_TYPE);
    });
  });
});
