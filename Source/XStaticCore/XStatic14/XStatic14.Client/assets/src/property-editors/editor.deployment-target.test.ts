import { afterEach, describe, expect, it } from 'vitest';
import './editor.deployment-target';
import type XStaticPropertyEditorDeploymentTypeElement from './editor.deployment-target';

describe('xstatic-property-editor-deployment-target', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders fallback heading when no fields are selected', async () => {
		const el = document.createElement(
			'xstatic-property-editor-deployment-target',
		) as XStaticPropertyEditorDeploymentTypeElement;
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot?.querySelector('h3')?.textContent).toBe('No Type selected');
	});

	it('maps deployer fields to and from UmbPropertyValueData and renders properties', async () => {
		const el = document.createElement(
			'xstatic-property-editor-deployment-target',
		) as XStaticPropertyEditorDeploymentTypeElement;
		el.value = [
			{ alias: 'host', name: 'Host', value: 'ftp.example.com', editorUiAlias: null },
			{
				alias: 'password',
				name: 'Password',
				value: 'secret',
				editorUiAlias: 'xstatic.propertyEditorUi.password',
			},
		];
		document.body.appendChild(el);
		await el.updateComplete;

		const props = el.shadowRoot?.querySelectorAll('umb-property');
		expect(props?.length).toBe(2);
		expect(props?.[0].getAttribute('property-editor-ui-alias')).toBe('Umb.PropertyEditorUi.TextBox');
		expect(props?.[1].getAttribute('property-editor-ui-alias')).toBe(
			'xstatic.propertyEditorUi.password',
		);

		expect(el.value).toEqual([
			{ alias: 'host', name: 'Host', value: 'ftp.example.com', editorUiAlias: null },
			{
				alias: 'password',
				name: 'Password',
				value: 'secret',
				editorUiAlias: 'xstatic.propertyEditorUi.password',
			},
		]);
	});

	it('keeps each field description after a field is edited', async () => {
		const el = document.createElement(
			'xstatic-property-editor-deployment-target',
		) as XStaticPropertyEditorDeploymentTypeElement;
		el.value = [
			{ alias: 'host', name: 'Host', value: 'ftp.example.com', help: 'The FTP server name.', editorUiAlias: null },
		];
		document.body.appendChild(el);
		await el.updateComplete;

		const dataset = el.shadowRoot?.querySelector('umb-property-dataset') as HTMLElement & {
			value: Array<{ alias: string; value: unknown }>;
		};
		dataset.value = [{ alias: 'host', value: 'ftp.changed.com' }];
		dataset.dispatchEvent(new Event('change'));
		await el.updateComplete;

		expect(el.value).toEqual([
			{ alias: 'host', name: 'Host', value: 'ftp.changed.com', help: 'The FTP server name.', editorUiAlias: null },
		]);
		const property = el.shadowRoot?.querySelector('umb-property') as (HTMLElement & { description?: string }) | null;
		expect(property?.description).toBe('The FTP server name.');
	});
});
