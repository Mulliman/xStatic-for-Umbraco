import { css, customElement, html, property, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UmbPropertyValueChangeEvent } from '@umbraco-cms/backoffice/property-editor';
import type { UmbPropertyEditorConfigCollection } from '@umbraco-cms/backoffice/property-editor';
import type { UmbPropertyEditorUiElement } from '@umbraco-cms/backoffice/extension-registry';
import { UmbPropertyDatasetElement, UmbPropertyValueData } from '@umbraco-cms/backoffice/property';

@customElement('xstatic-property-editor-dynamic-form')
export class XStaticPropertyEditorDynamicFormElement extends UmbLitElement implements UmbPropertyEditorUiElement {

    // @state()
	// private _fields: Record<string, string | null> | null | undefined;

    @state() 
    _values: Array<UmbPropertyValueData> = [];

	@property({ type: Array })
	public set value(value: Record<string, string | null> | null | undefined) {
        let array = this.recordAsArray(value);

		this._values = array.map((field) => {
            return {
                alias: field.key,
                value: field.value
            }
        });
	}

    public get value(): Record<string, string | null> | null | undefined {
        let record: Record<string, string | null> = {};

        this._values.forEach((x) => record[x.alias] = x.value as string | null);

        return record;
    }

	public set config(config: UmbPropertyEditorConfigCollection | undefined) {
		if (!config) return;

		const fields = config.getValueByAlias('fields') as Record<string, string | null> | null | undefined;

        this.value = fields;
	}

    #onPropertyDataChange(e: Event) {
        const value = (e.target as UmbPropertyDatasetElement).value;

        this._values = value;

        this.dispatchEvent(new UmbPropertyValueChangeEvent());
    }

    recordAsArray(record: Record<string, string | null> | null | undefined): { key: string, value: string | null }[] {
        if(!record) {
            return [];
        }

        return Object.entries(record).map(([key, value]) => ({ key: key, value: value }));
    }

	override render() {
		return this.#renderForm();
	}

	#renderForm() {
        if(!this._values) {
            return html`<h3>No Action Type selected</h3>`;
        }
        
		return html`
            <umb-property-dataset
                  .value=${this._values as Array<UmbPropertyValueData>}
                  @change=${this.#onPropertyDataChange}
                >
                  ${this._values
                .map(
                    (prop) =>

                        html`<umb-property
                          alias=${prop.alias}
                          label=${prop.alias}
                          property-editor-ui-alias="Umb.PropertyEditorUi.TextBox"
                        ></umb-property>`
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

export default XStaticPropertyEditorDynamicFormElement;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-property-editor-dynamic-form': XStaticPropertyEditorDynamicFormElement;
	}
}
