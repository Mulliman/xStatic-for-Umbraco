import { customElement, html, property, repeat, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import type { UmbPropertyEditorConfigCollection, UmbPropertyEditorUiElement } from '@umbraco-cms/backoffice/property-editor';
import { UmbPropertyDatasetElement, UmbPropertyValueData } from '@umbraco-cms/backoffice/property';
import { ConfigurableTypeField } from '../api';
import { UmbChangeEvent } from '@umbraco-cms/backoffice/event';
import { toApiFieldValue, toEditorValue } from '../code/field-value-converter';
import { hasSecretField } from './element.secret-reference-tip';

@customElement('xstatic-property-editor-configurable-dynamic-form')
export class XStaticPropertyEditorDynamicConfigurableFormElement extends UmbLitElement implements UmbPropertyEditorUiElement {

    @state()
	private _fields: ConfigurableTypeField[] | null | undefined;

    @state() 
    _values: Array<UmbPropertyValueData> = [];

    @state()
    _config?: UmbPropertyEditorConfigCollection;

    @state()
	help?: string; 

	@property({ type: Array })
	public set value(value: ConfigurableTypeField[] | null | undefined) {
        this._fields = value;

        if(!value) {
            this._values = [];
            return; 
        }
        
       	this._values = value.filter((f) => f.name).map((field) => {
            return {
                alias: field.alias,
                value: toEditorValue(field.value, field.editorUiAlias)
            } as UmbPropertyValueData;
        });
	}

    public get value(): ConfigurableTypeField[]| null | undefined {
        return this.#getArrayFromDataset(this._values);
    }

	public set config(config: UmbPropertyEditorConfigCollection | undefined) {
		if (!config) return;

        this._config = config;

        const help = config.getValueByAlias('help') as string | null | undefined;

        if(help){
            this.help = help;
        }

		const fields = config.getValueByAlias('fields') as ConfigurableTypeField[] | null | undefined;

        this.value = fields;
	}

    #onPropertyDataChange(e: Event) {
        const value = (e.target as UmbPropertyDatasetElement).value;

        const array = this.#getArrayFromDataset(value);

        this.value = array;

        this.dispatchEvent(new UmbChangeEvent());
    }

    #getArrayFromDataset(value: UmbPropertyValueData[]): ConfigurableTypeField[] {
        return this._fields?.map((f) => ({
            name: f.name,
            alias: f.alias,
            value: toApiFieldValue(value.find((x) => x.alias === f.alias)?.value),
            editorUiAlias: f.editorUiAlias
        } as ConfigurableTypeField)) ?? [];
    }

	override render() {
		return this.#renderForm();
	}

	#renderForm() {
        if (this._fields === undefined) {
            return html`<h3>No type selected</h3>`;
        }

        if (!this._fields || this._fields.length === 0) {
            return html`
            <div>
                ${this.help ? html`<p>${this.help}</p>` : ''}
                <h3>This action type can't be configured</h3>
            </div>
            `;
        }

		return html`
        <div>
            ${this.help ? html`<p>${this.help}</p>` : ''}
            ${hasSecretField(this._fields) ? html`<xstatic-secret-reference-tip></xstatic-secret-reference-tip>` : ''}

        <umb-property-dataset
                  .value=${this._values as Array<UmbPropertyValueData>}
                  @change=${this.#onPropertyDataChange}
                >
                  ${repeat(
                    this._fields,
                    (prop) => `${prop.alias ?? prop.name ?? ''}-${prop.editorUiAlias ?? 'Umb.PropertyEditorUi.TextBox'}`,
                    (prop) => html`<umb-property
                          alias=${prop.alias ?? ''}
                          label=${prop.name ?? ''}
                          property-editor-ui-alias=${prop.editorUiAlias ?? "Umb.PropertyEditorUi.TextBox"}
                        ></umb-property>`
                  )}
                </umb-property-dataset>
        </div>
		`;
	}

}

export default XStaticPropertyEditorDynamicConfigurableFormElement;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-property-editor-configurable-dynamic-form': XStaticPropertyEditorDynamicConfigurableFormElement;
	}
}
