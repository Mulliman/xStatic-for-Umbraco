import { afterEach, describe, expect, it, vi } from 'vitest';
import { UmbPropertyEditorConfigCollection } from '@umbraco-cms/backoffice/property-editor';
import { UmbChangeEvent } from '@umbraco-cms/backoffice/event';
import type { ConfigurableTypeField } from '../api';
import './editor.dynamic-configurable-form';
import type XStaticPropertyEditorDynamicConfigurableFormElement from './editor.dynamic-configurable-form';

function config(fields: ConfigurableTypeField[] | null | undefined, help?: string) {
	return new UmbPropertyEditorConfigCollection([
		{ alias: 'fields', value: fields },
		...(help !== undefined ? [{ alias: 'help', value: help }] : []),
	]);
}

function create() {
	const el = document.createElement(
		'xstatic-property-editor-configurable-dynamic-form',
	) as XStaticPropertyEditorDynamicConfigurableFormElement;
	document.body.appendChild(el);
	return el;
}

describe('xstatic-property-editor-configurable-dynamic-form', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('shows "No type selected" when there are no fields yet', async () => {
		const el = create();
		await el.updateComplete;

		expect(el.shadowRoot?.querySelector('h3')?.textContent).toBe('No type selected');
	});

	it("says the action type can't be configured when it has no fields", async () => {
		const el = create();
		el.config = config([], 'Clears the CDN cache.');
		await el.updateComplete;

		expect(el.shadowRoot?.querySelector('h3')?.textContent).toBe("This action type can't be configured");
		expect(el.shadowRoot?.querySelector('p')?.textContent).toBe('Clears the CDN cache.');
	});

	it('clears the help text when switching to an action type without help', async () => {
		const el = create();
		el.config = config([{ alias: 'url', name: 'Url', value: '' }], 'Calls a webhook.');
		await el.updateComplete;
		expect(el.shadowRoot?.querySelector('p')?.textContent).toBe('Calls a webhook.');

		el.config = config([{ alias: 'folder', name: 'Folder', value: '' }]);
		await el.updateComplete;

		expect(el.help).toBeUndefined();
		expect(el.shadowRoot?.querySelector('p')).toBeNull();
	});

	it('updates its value and dispatches a change event when a field is edited', async () => {
		const el = create();
		el.config = config([{ alias: 'url', name: 'Url', value: 'https://old.example.com', editorUiAlias: null }]);
		await el.updateComplete;

		const onChange = vi.fn();
		el.addEventListener(UmbChangeEvent.TYPE, onChange);

		const dataset = el.shadowRoot?.querySelector('umb-property-dataset') as HTMLElement & {
			value: Array<{ alias: string; value: unknown }>;
		};
		expect(dataset).not.toBeNull();
		dataset.value = [{ alias: 'url', value: 'https://new.example.com' }];
		dataset.dispatchEvent(new Event('change'));

		expect(onChange).toHaveBeenCalledOnce();
		expect(el.value).toEqual([
			{ alias: 'url', name: 'Url', value: 'https://new.example.com', editorUiAlias: null },
		]);
	});
});
