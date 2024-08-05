import { customElement, html, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement } from "@umbraco-cms/backoffice/modal";

import { UmbModalToken } from "@umbraco-cms/backoffice/modal";
import { ActionModel, ActionUpdateModel, ConfigurableTypeModel, XStaticConfig } from "../../api";
import { UmbPropertyDatasetElement, UmbPropertyValueData } from "@umbraco-cms/backoffice/property";
import { PropertyEditorSettingsProperty } from "@umbraco-cms/backoffice/extension-registry";
import ActionContext, { ACTION_CONTEXT_TOKEN } from "./context.action";

@customElement('xstatic-edit-action-modal')
export class EditActionModalElement extends
    UmbModalBaseElement<EditActionModalData, EditActionModalValue>
{
    #actionContext?: ActionContext;

    @state()
    content: ActionModel = {} as ActionModel;

    @state() 
    values: Array<UmbPropertyValueData> = [];

    @state()
    config: XStaticConfig | undefined;

    @state()
    isLoaded: boolean = false;

    #inited!: Promise<unknown>;

    constructor() {
        super();

        this.#inited = this.consumeContext(
            ACTION_CONTEXT_TOKEN,
            (context) => {
              this.#actionContext = context;
            }
          ).asPromise();

          this.#init();
    }

    // #region init

    async #init(){
        await this.#inited;

        if(this.data?.content) {
            this.#mapToPropertyValueData();
        }

        this.observe(this.#actionContext?.config, (x) => {
            this.config = x;

            this.isLoaded = true;
        });
    }

    // #endregion init

    //#region Render

    render() {
        if (!this.isLoaded) {
            return html`Loading...`;
        }

        return html`
            <umb-body-layout .headline=${this.data?.headline ?? 'Create new export type'}>
                <uui-box>
                <umb-property-dataset
                  .value=${this.values as Array<UmbPropertyValueData>}
                  @change=${this.#onPropertyDataChange}
                >
                  ${this.#getBaseProperties()
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

    // #endregion Render

    // #region Handlers

    async #handleConfirm() {
        if (!this.values) {
            throw new Error('No data provided');
        }

        var postModel = this.#createPostModel();

        const data = postModel.id > 0
            ? await this.#actionContext!.updateAction(postModel)
            : await this.#actionContext!.createAction(postModel);

        if(data) {
            this.modalContext?.submit();
        }
    }

    #handleCancel() {
        this.modalContext?.reject();
    }

    #onPropertyDataChange(e: Event) {
        const value = (e.target as UmbPropertyDatasetElement).value;
        this.values = value;
    }

    // #endregion Handlers

    // #region Form

    #getBaseProperties(): PropertyEditorSettingsProperty[] {

        var selectedType = this.getFirst(this.values.find((x) => x.alias === 'type')?.value as Array<string>);
        
        var existingConfig = this.values.find((x) => x.alias === 'config')?.value as Record<string, string | null>;
        var selectedActionType = this.config?.postGenerationActions?.find((x) => x.id === selectedType);

        var selectedConfig = this.#isExistingConfigValid(existingConfig, selectedActionType)
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

    #isExistingConfigValid(existingConfig: Record<string, string | null> | null | undefined, 
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

    // #endregion Form

    // #region Mappers

    #createPostModel() : ActionUpdateModel {
        var model = 
        {
            name: this.values.find((x) => x.alias === 'name')?.value,
            id: this.data?.content.id,
            type: this.getFirst(this.values.find((x) => x.alias === 'type')?.value as Array<string>),
            config: this.values.find((x) => x.alias === 'config')?.value as Record<string, string | null>,
        } as ActionUpdateModel;

        return model;
    }

    #mapToPropertyValueData() {
        var updateModel: ActionUpdateModel = {
            id: this.data?.content?.id ?? 0,
            name: this.data?.content?.name,
            type: this.data?.content?.type?.id,
            config: this.data?.content?.type?.fields,
        };

        this.updateValue({ content: updateModel });

        this.values = [
            { alias: 'id', value: updateModel.id },
            { alias: 'name', value: updateModel.name },
            { alias: 'type', value: [updateModel.type] },
            { alias: 'config', value: updateModel.config },
        ];
    }

    // #endregion Mappers

    // #region Utils

    getFirst(value: any[]) {
        return value?.length > 0 ? value[0] : null;
    }
    
    recordAsArray(record: Record<string, string | null> | null | undefined): { key: string, value: string | null }[] {
        if(!record) {
            return [];
        }

        return Object.entries(record).map(([key, value]) => ({ key: key, value: value }));
    }

    // #endregion Utils
}

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

export default EditActionModalElement;