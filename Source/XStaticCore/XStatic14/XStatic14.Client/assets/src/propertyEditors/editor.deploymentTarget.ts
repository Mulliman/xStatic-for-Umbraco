import { css, customElement, html, property, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UmbPropertyValueChangeEvent } from '@umbraco-cms/backoffice/property-editor';
import type { UmbPropertyEditorConfigCollection } from '@umbraco-cms/backoffice/property-editor';
import type { UmbPropertyEditorUiElement } from '@umbraco-cms/backoffice/extension-registry';
import { UmbPropertyDatasetElement, UmbPropertyValueData } from '@umbraco-cms/backoffice/property';
import { DeployerField } from '../api';

@customElement('xstatic-property-editor-deployment-target')
export class XStaticPropertyEditorDeploymentTypeElement extends UmbLitElement implements UmbPropertyEditorUiElement {

    @state()
	private _fields: DeployerField[] | null | undefined;

    @state() 
    private _values: Array<UmbPropertyValueData> = [];

	@property({ type: Array })
	public set value(value: DeployerField[] | null | undefined) {
        if(!value) {
            this._values = [];
            return; 
        }

        this._fields = value;

       	this._values = value.filter((f) => f.name).map((field) => {
            return {
                alias: field.name,
                value: field.value
            } as UmbPropertyValueData;
        });
        
        console.log('set _values', this._values);
	}

    public get value(): DeployerField[] {
        return this._fields?.map((f) => ({
            name: f.name,
            value: this._values.find((x) => x.alias === f.name)?.value
        } as DeployerField)) ?? [];
    }

	public set config(config: UmbPropertyEditorConfigCollection | undefined) {
		if (!config) return;

		const fields = config.getValueByAlias('fields') as DeployerField[] | null | undefined;

        console.log('config', fields);

        this.value = fields;
	}

    #onPropertyDataChange(e: Event) {
        const value = (e.target as UmbPropertyDatasetElement).value;

        this._values = value;

        console.log('values', this._values);

        this.dispatchEvent(new UmbPropertyValueChangeEvent());
    }

    // recordAsArray(record: Record<string, string | null> | null | undefined): { key: string, value: string | null }[] {
    //     if(!record) {
    //         return [];
    //     }

    //     return Object.entries(record).map(([key, value]) => ({ key: key, value: value }));
    // }

	override render() {
		return this.#renderForm();
	}

	#renderForm() {
        if(!this._values || !this._fields) {
            return html`<h3>No Deployer selected</h3>`;
        }

        console.log('renderForm', this._values);

		return html`
            <umb-property-dataset
                  .value=${this._values as Array<UmbPropertyValueData>}
                  @change=${this.#onPropertyDataChange}
                >
                  ${this._fields
                .map(
                    (prop) =>

                        html`<umb-property
                          alias=${prop.name!}
                          label=${prop.name!}
                          property-editor-ui-alias=${prop.editorUiAlias ?? "Umb.PropertyEditorUi.TextBox"}
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

export default XStaticPropertyEditorDeploymentTypeElement;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-property-editor-deployment-target': XStaticPropertyEditorDeploymentTypeElement;
	}
}
