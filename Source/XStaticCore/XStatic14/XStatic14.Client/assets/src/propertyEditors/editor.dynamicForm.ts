import { css, customElement, html, property, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UmbPropertyValueChangeEvent } from '@umbraco-cms/backoffice/property-editor';
import type { UmbPropertyEditorConfigCollection } from '@umbraco-cms/backoffice/property-editor';
import type { UmbPropertyEditorUiElement } from '@umbraco-cms/backoffice/extension-registry';
import { UmbPropertyDatasetElement, UmbPropertyValueData } from '@umbraco-cms/backoffice/property';

type DynamicFormField = { 
    name?: string | null | undefined,
    alias?: string | null | undefined,
    editorUiAlias?: string | null | undefined
};

export abstract class XStaticPropertyEditorDynamicFormBase<TFieldType extends DynamicFormField> 
    extends UmbLitElement 
    implements UmbPropertyEditorUiElement {

        @state()
        fields: Array<TFieldType> | null | undefined;
    
        @state() 
        values: Array<UmbPropertyValueData> = [];

        @property({ type: Array })
        public set value(value: TFieldType[] | null | undefined) {
            if(!value) {
                this.values = [];
                return; 
            }
    
            this.fields = value;
            this.values = this.mapToPropertyValueData(value);
        }
    
        public get value(): TFieldType[]| null | undefined {
            return this.mapFromPropertyValueData(this.values);
        }
    
        public set config(config: UmbPropertyEditorConfigCollection | undefined) {
            if (!config) return;
    
            const fields = config.getValueByAlias('fields') as TFieldType[] | null | undefined;
    
            this.value = fields;
        }
    
        onPropertyDataChange(e: Event) {
            const value = (e.target as UmbPropertyDatasetElement).value;
    
            let array = this.mapFromPropertyValueData(value);
            this.value = array;

            this.dispatchEvent(new UmbPropertyValueChangeEvent());
        }

        abstract mapToPropertyValueData(value: TFieldType[]): UmbPropertyValueData[];

        abstract mapFromPropertyValueData(value: UmbPropertyValueData[]): TFieldType[];

        override render() {
            return this.renderForm();
        }
    
        renderForm() {
            if(!this.values || !this.fields) {
                return html`<h3>No Type selected</h3>`;
            }

            return html`
                <umb-property-dataset
                      .value=${this.values as Array<UmbPropertyValueData>}
                      @change=${this.onPropertyDataChange}
                    >

                      ${this.fields
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
}

export default XStaticPropertyEditorDynamicFormBase;