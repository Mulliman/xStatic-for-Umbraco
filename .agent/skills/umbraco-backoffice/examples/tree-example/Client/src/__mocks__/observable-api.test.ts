import { expect } from '@open-wc/testing';
import { UmbStringState, UmbArrayState } from './observable-api.js';

describe('Observable API (Mock)', () => {
  describe('UmbStringState', () => {
    it('should initialize with undefined by default', () => {
      const state = new UmbStringState(undefined);
      expect(state.getValue()).to.be.undefined;
    });

    it('should initialize with provided value', () => {
      const state = new UmbStringState('initial');
      expect(state.getValue()).to.equal('initial');
    });

    it('should update value with setValue', () => {
      const state = new UmbStringState('initial');
      state.setValue('updated');
      expect(state.getValue()).to.equal('updated');
    });

    it('should notify subscribers on value change', () => {
      const state = new UmbStringState('initial');
      const values: (string | undefined)[] = [];

      state.asObservable().subscribe((value) => {
        values.push(value);
      });

      state.setValue('updated');
      state.setValue('final');

      expect(values).to.deep.equal(['initial', 'updated', 'final']);
    });

    it('should allow unsubscribe', () => {
      const state = new UmbStringState('initial');
      const values: (string | undefined)[] = [];

      const subscription = state.asObservable().subscribe((value) => {
        values.push(value);
      });

      state.setValue('updated');
      subscription.unsubscribe();
      state.setValue('after-unsubscribe');

      expect(values).to.deep.equal(['initial', 'updated']);
    });

    it('should clear subscribers on destroy', () => {
      const state = new UmbStringState('initial');
      const values: (string | undefined)[] = [];

      state.asObservable().subscribe((value) => {
        values.push(value);
      });

      state.destroy();
      state.setValue('after-destroy');

      expect(values).to.deep.equal(['initial']);
    });
  });

  describe('UmbArrayState', () => {
    it('should initialize with empty array by default', () => {
      const state = new UmbArrayState(undefined);
      expect(state.getValue()).to.deep.equal([]);
    });

    it('should initialize with provided array', () => {
      const state = new UmbArrayState([1, 2, 3]);
      expect(state.getValue()).to.deep.equal([1, 2, 3]);
    });

    it('should update value with setValue', () => {
      const state = new UmbArrayState([1, 2]);
      state.setValue([3, 4, 5]);
      expect(state.getValue()).to.deep.equal([3, 4, 5]);
    });

    it('should notify subscribers on value change', () => {
      const state = new UmbArrayState<number>([1]);
      const values: number[][] = [];

      state.asObservable().subscribe((value) => {
        values.push([...value]);
      });

      state.setValue([1, 2]);
      state.setValue([1, 2, 3]);

      expect(values).to.deep.equal([[1], [1, 2], [1, 2, 3]]);
    });
  });
});
