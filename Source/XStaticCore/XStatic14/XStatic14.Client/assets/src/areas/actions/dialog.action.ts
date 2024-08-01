import { customElement, html, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement } from "@umbraco-cms/backoffice/modal";

import { UmbModalToken } from "@umbraco-cms/backoffice/modal";
import { ActionModel, ActionUpdateModel, ConfigurableTypeModel, ExportTypeUpdateModel, XStaticConfig } from "../../api";
import { UmbPropertyDatasetElement, UmbPropertyValueData } from "@umbraco-cms/backoffice/property";
import { PropertyEditorSettingsProperty } from "@umbraco-cms/backoffice/extension-registry";
import ActionContext, { ACTION_CONTEXT_TOKEN } from "./context.action";

export interface EditActionModalData {
    headline?: string;
    content: ActionModel;
}

export interface EditActionModalValue {
    content: ActionUpdateModel;
}

export const EditActionModal = new UmbModalToken<EditActionModalData, EditActionModalValue>(
    "xstatic.editActionModal",
    {
        modal: {
            type: 'sidebar',
            size: 'large',
        }
    }
);

@customElement('xstatic-edit-action-modal')
export class EditActionModalElement extends
    UmbModalBaseElement<EditActionModalData, EditActionModalValue>
{
    #actionContext?: ActionContext;

    @state()
    content: ActionModel = {} as ActionModel;

    @state() 
    _values: Array<UmbPropertyValueData> = [];

    @state()
    config: XStaticConfig | undefined;

    @state()
    isLoaded: boolean = false;

    constructor() {
        super();

        this.consumeContext(
            ACTION_CONTEXT_TOKEN,
            (context) => {
              this.#actionContext = context;

              if(this.data?.content) {
                var updateModel : ActionUpdateModel = {
                    id: this.data?.content?.id ?? 0,
                    name: this.data?.content?.name,
                    type: this.data?.content?.type?.id,
                    config: this.data?.content?.type?.fields,
                };
    
                this.updateValue({ content: updateModel });
    
                this._values = [
                    { alias: 'id', value: updateModel.id },
                    { alias: 'name', value: updateModel.name },
                    { alias: 'type', value: [updateModel.type] },
                    { alias: 'config', value: updateModel.config },
                ];
    
                console.log('values', this._values);
            }
    
            this.#actionContext!.getConfig().then(() => {
                this.isLoaded = true;
            });
    
            this.observe(this.#actionContext?.config, (x) => {
                this.config = x;
            });
            }
          );
    }

    async #handleConfirm() {
        if (!this._values) {
            throw new Error('No data provided');
        }

        var postModel = this.createPostModel();

        const data = postModel.id > 0
            ? await this.#actionContext!.updateAction(postModel)
            : await this.#actionContext!.createAction(postModel);

        if(data) {
            this.modalContext?.submit();
        }
    }

    getFirst(value: any[]) {
        return value?.length > 0 ? value[0] : null;
    }
    
    createPostModel() : ActionUpdateModel {

        console.log('createPostModel values', this._values);

        var model = 
        {
            name: this._values.find((x) => x.alias === 'name')?.value,
            id: this.data?.content.id,
            type: this.getFirst(this._values.find((x) => x.alias === 'type')?.value as Array<string>),
            config: this._values.find((x) => x.alias === 'config')?.value as Record<string, string | null>,
        } as ActionUpdateModel;

        console.log('createPostModel model', model);

        return model;
    }

    #handleCancel() {
        this.modalContext?.reject();
    }

    recordAsArray(record: Record<string, string | null> | null | undefined): { key: string, value: string | null }[] {
        if(!record) {
            return [];
        }

        return Object.entries(record).map(([key, value]) => ({ key: key, value: value }));
    }

    isExistingConfigValid(existingConfig: Record<string, string | null> | null | undefined, 
        selectedActionType: ConfigurableTypeModel | null | undefined) {
        if(!existingConfig || !selectedActionType) {
            return false;
        }

        var existingFields = this.recordAsArray(existingConfig);
        var selectedFields = this.recordAsArray(selectedActionType.fields);

        if(existingFields.length !== selectedFields.length) {
            return false;
        }

        for (let i = 0; i < selectedFields.length; i++) {
            const selectedField = selectedFields[i];
            const existingField = existingFields.find((x) => x.key === selectedField.key);

            if(!existingField) {
                console.log('existingField not found', selectedField.key);
                return false;
            }
        }

        return true;
    }

    getBaseProperties(): PropertyEditorSettingsProperty[] {

        var selectedType = this.getFirst(this._values.find((x) => x.alias === 'type')?.value as Array<string>);
        
        var existingConfig = this._values.find((x) => x.alias === 'config')?.value as Record<string, string | null>;
        var selectedActionType = this.config?.postGenerationActions?.find((x) => x.id === selectedType);

        var selectedConfig = this.isExistingConfigValid(existingConfig, selectedActionType)
            ? existingConfig
            : selectedActionType?.fields;

        return [
            {
                alias: "name",
                label: "Action Name",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.TextBox",
                config: [
                    {
                        alias: 'validation',
                        value: {
                            mandatory: true,
                            pattern: null,
                            minLength: 1,
                            maxLength: 255,
                            error: "Name is required"
                        }
                    },
                ],
            },
            {
                alias: "type",
                label: "Action Type",
                description: "This is the type of action that you want to configure a specific instance of.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.Dropdown",
                config: [
                    {
                        alias: 'items',
                        value: this.config?.postGenerationActions?.map((x) => ({ name: x.name, value: x.id })) ?? []
                    },
                ],
            },
            {
                alias: "config",
                label: "Configuration",
                description: "Use this to set what specific configuration you want to use for the selected type. The fields may change depending on the type selected.",
                propertyEditorUiAlias: "xstatic.propertyEditorUi.dynamicForm",
                config: [
                    {
                        alias: 'fields',
                        value: selectedConfig
                    },
                ],
            },
        ];
    } 

    #onPropertyDataChange(e: Event) {
        const value = (e.target as UmbPropertyDatasetElement).value;
        this._values = value;

        console.log('onPropertyDataChange values', this._values);
    }

    render() {
        return html`
            <umb-body-layout .headline=${this.data?.headline ?? 'Create new export type'}>
                <uui-box>
                <umb-property-dataset
                  .value=${this._values as Array<UmbPropertyValueData>}
                  @change=${this.#onPropertyDataChange}
                >
                  ${this.getBaseProperties()
                .map(
                    (prop) =>

                        html`<umb-property
                          alias=${prop.alias}
                          label=${prop.label}
                          .description=${prop.description}
                          property-editor-ui-alias=${prop.propertyEditorUiAlias}
                          .config=${prop.config}
                        ></umb-property>`
                )}
                </umb-property-dataset>

                </uui-box>

                <div slot="actions">
                        <uui-button id="cancel" label="Cancel" @click="${this.#handleCancel}">Cancel</uui-button>
                        <uui-button
                            id="submit"
                            color='positive'
                            look="primary"
                            label="Submit"
                            @click=${this.#handleConfirm}></uui-button>
            </div>
            </umb-body-layout>
        `;
    }

}

export default EditActionModalElement;