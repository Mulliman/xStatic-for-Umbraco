import { afterEach, describe, expect, it } from 'vitest';
import './element.dashboard-grid';
import type DashboardGrid from './element.dashboard-grid';

describe('xstatic-dashboard-grid', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders named info and grid slots inside their layout containers', async () => {
		const el = document.createElement('xstatic-dashboard-grid') as DashboardGrid;
		document.body.appendChild(el);
		await el.updateComplete;

		const infoSlot = el.shadowRoot?.querySelector('.info slot[name="info"]');
		const gridSlot = el.shadowRoot?.querySelector('.grid slot[name="grid"]');

		expect(infoSlot).not.toBeNull();
		expect(gridSlot).not.toBeNull();
	});
});
