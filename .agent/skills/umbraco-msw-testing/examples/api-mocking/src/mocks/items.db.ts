/**
 * Mock Database for Items
 *
 * Demonstrates:
 * - Stateful mock data
 * - CRUD operations
 * - Data isolation between tests
 */

export interface Item {
	id: string;
	name: string;
	description: string;
	createdAt: string;
}

// Initial mock data
const initialItems: Item[] = [
	{
		id: 'item-1',
		name: 'First Item',
		description: 'This is the first item',
		createdAt: '2024-01-01T00:00:00Z',
	},
	{
		id: 'item-2',
		name: 'Second Item',
		description: 'This is the second item',
		createdAt: '2024-01-02T00:00:00Z',
	},
	{
		id: 'item-3',
		name: 'Third Item',
		description: 'This is the third item',
		createdAt: '2024-01-03T00:00:00Z',
	},
];

/**
 * Items Mock Database
 *
 * Provides CRUD operations for mock items.
 * State persists during test session but can be reset.
 */
class ItemsMockDb {
	private items: Item[] = [...initialItems];

	/** Get all items */
	getAll(): Item[] {
		return [...this.items];
	}

	/** Get item by ID */
	getById(id: string): Item | undefined {
		return this.items.find((item) => item.id === id);
	}

	/** Get item by name */
	getByName(name: string): Item | undefined {
		return this.items.find((item) => item.name === name);
	}

	/** Create a new item */
	create(item: Omit<Item, 'id' | 'createdAt'>): Item {
		const newItem: Item = {
			...item,
			id: `item-${Date.now()}`,
			createdAt: new Date().toISOString(),
		};
		this.items.push(newItem);
		return newItem;
	}

	/** Update an existing item */
	update(id: string, updates: Partial<Omit<Item, 'id' | 'createdAt'>>): Item | undefined {
		const index = this.items.findIndex((item) => item.id === id);
		if (index === -1) return undefined;

		this.items[index] = { ...this.items[index], ...updates };
		return this.items[index];
	}

	/** Delete an item */
	delete(id: string): boolean {
		const initialLength = this.items.length;
		this.items = this.items.filter((item) => item.id !== id);
		return this.items.length < initialLength;
	}

	/** Check if item exists */
	exists(id: string): boolean {
		return this.items.some((item) => item.id === id);
	}

	/** Reset to initial state (useful between tests) */
	reset(): void {
		this.items = [...initialItems];
	}

	/** Get count */
	get count(): number {
		return this.items.length;
	}
}

// Export singleton instance
export const itemsDb = new ItemsMockDb();
