import { css, customElement, html, property, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UmbPropertyValueChangeEvent } from '@umbraco-cms/backoffice/property-editor';
import type { UmbPropertyEditorConfigCollection } from '@umbraco-cms/backoffice/property-editor';
import type { UmbPropertyEditorUiElement } from '@umbraco-cms/backoffice/extension-registry';
import { UmbPropertyDatasetElement, UmbPropertyValueData } from '@umbraco-cms/backoffice/property';
import { ConfigurableTypeField } from '../api';

@customElement('xstatic-property-editor-configurable-dynamic-form')
export class XStaticPropertyEditorDynamicConfigurableFormElement extends UmbLitElement implements UmbPropertyEditorUiElement {

    @state()
	private _fields: ConfigurableTypeField[] | null | undefined;

    @state() 
    _values: Array<UmbPropertyValueData> = [];

    @state()
    _config?: UmbPropertyEditorConfigCollection;

	@property({ type: Array })
	public set value(value: ConfigurableTypeField[] | null | undefined) {
        if(!value) {
            this._values = [];
            return; 
        }

        this._fields = value;
        
       	this._values = value.filter((f) => f.name).map((field) => {
            return {
                alias: field.alias,
                value: field.value
            } as UmbPropertyValueData;
        });
	}

    public get value(): ConfigurableTypeField[]| null | undefined {
        return this.#getArrayFromDataset(this._values);
    }

	public set config(config: UmbPropertyEditorConfigCollection | undefined) {
		if (!config) return;

        this._config = config;

		const fields = config.getValueByAlias('fields') as ConfigurableTypeField[] | null | undefined;

        this.value = fields;
	}

    #onPropertyDataChange(e: Event) {
        const value = (e.target as UmbPropertyDatasetElement).value;

        let array = this.#getArrayFromDataset(value);

        this.value = array;

        this.dispatchEvent(new UmbPropertyValueChangeEvent());
    }

    #getArrayFromDataset(value: UmbPropertyValueData[]): ConfigurableTypeField[] {
        return this._fields?.map((f) => ({
            name: f.name,
            alias: f.alias,
            value: value.find((x) => x.alias === f.alias)?.value,
            editorUiAlias: f.editorUiAlias
        } as ConfigurableTypeField)) ?? [];
    }

	override render() {
		return this.#renderForm();
	}

	#renderForm() {
        if(!this._values || !this._fields) {
            return html`<h3>No Type selected</h3>`;
        }

		return html`
            <umb-property-dataset
                  .value=${this._values as Array<UmbPropertyValueData>}
                  @change=${this.#onPropertyDataChange}
                >
                  ${this._fields
                .map(
                    (prop) => {
                        return html`<umb-property
                          alias=${prop.alias!}
                          label=${prop.name!}
                          property-editor-ui-alias=${prop.editorUiAlias ?? "Umb.PropertyEditorUi.TextBox"}
                        ></umb-property>`}
                )}
                </umb-property-dataset>
		`;
	}

	static override styles = [
		css`
            umb-property{
                --uui-size-layout-1: 10px;
            }
		`,
	];
}

export default XStaticPropertyEditorDynamicConfigurableFormElement;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-property-editor-configurable-dynamic-form': XStaticPropertyEditorDynamicConfigurableFormElement;
	}
}
