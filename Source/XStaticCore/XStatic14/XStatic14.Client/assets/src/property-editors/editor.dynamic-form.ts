import { css, customElement, html, property, repeat, state, unsafeHTML } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import type { UmbPropertyEditorConfigCollection, UmbPropertyEditorUiElement } from '@umbraco-cms/backoffice/property-editor';
// import type { UmbPropertyEditorUiElement } from '@umbraco-cms/backoffice/extension-registry';
import { UmbPropertyDatasetElement, UmbPropertyValueData } from '@umbraco-cms/backoffice/property';
import { UmbChangeEvent } from '@umbraco-cms/backoffice/event';
import { hasSecretField } from './element.secret-reference-tip';

type DynamicFormField = { 
    name?: string | null | undefined,
    alias?: string | null | undefined,
    editorUiAlias?: string | null | undefined,
    help?: string | null | undefined
};

export abstract class XStaticPropertyEditorDynamicFormBase<TFieldType extends DynamicFormField> 
    extends UmbLitElement 
    implements UmbPropertyEditorUiElement {

        @state()
        fields: Array<TFieldType> | null | undefined;
    
        @state() 
        values: Array<UmbPropertyValueData> = [];

        @state()
        help?: string; 

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

            const help = config.getValueByAlias('help') as string | null | undefined;
            this.help = help ?? undefined;
        }
    
        onPropertyDataChange(e: Event) {
            const value = (e.target as UmbPropertyDatasetElement).value;
    
            let array = this.mapFromPropertyValueData(value);
            this.value = array;

            this.dispatchEvent(new UmbChangeEvent());
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
                <div>
                    ${this.help ? html`<div class="help"><uui-icon name="icon-help-alt"></uui-icon><div>${unsafeHTML(this.help)}</div></div>` : ''}
                    ${hasSecretField(this.fields) ? html`<xstatic-secret-reference-tip></xstatic-secret-reference-tip>` : ''}


                    <umb-property-dataset
                      .value=${this.values as Array<UmbPropertyValueData>}
                      @change=${this.onPropertyDataChange}
                    >

                      ${repeat(
                        this.fields,
                        (prop) => `${prop.alias ?? prop.name ?? ''}-${prop.editorUiAlias ?? 'Umb.PropertyEditorUi.TextBox'}`,
                        (prop) => html`<umb-property
                              alias=${prop.alias!}
                              label=${prop.name!}
                              .description=${prop.help ?? ''}
                              property-editor-ui-alias=${prop.editorUiAlias ?? "Umb.PropertyEditorUi.TextBox"}
                            ></umb-property>`
                      )}

                    </umb-property-dataset>
                </div>
            `;
        }
}

export default XStaticPropertyEditorDynamicFormBase;