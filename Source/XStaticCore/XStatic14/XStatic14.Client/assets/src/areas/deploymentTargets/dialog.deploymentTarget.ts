import { customElement, html, ifDefined, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement } from "@umbraco-cms/backoffice/modal";

import { UmbModalToken } from "@umbraco-cms/backoffice/modal";
import { DeployerField, DeployerModel, DeploymentTargetModel, DeploymentTargetUpdateModel, XStaticConfig } from "../../api";
import { UmbPropertyDatasetElement, UmbPropertyValueData } from "@umbraco-cms/backoffice/property";
import { PropertyEditorSettingsProperty } from "@umbraco-cms/backoffice/extension-registry";
import DeploymentTargetContext, { DEPLOYMENT_TARGET_CONTEXT_TOKEN } from "./context.deploymentTargets";

import "../../elements/element.validationError";

@customElement('xstatic-edit-deployment-target-modal')
export class EditDeploymentTargetModalElement extends
    UmbModalBaseElement<EditDeploymentTargetModalData, EditDeploymentTargetModalValue>
{
    #deploymentTargetContext?: DeploymentTargetContext;

    @state()
    content: DeploymentTargetModel = {} as DeploymentTargetModel;

    @state()
    _values: Array<UmbPropertyValueData> = [];

    @state()
    config: XStaticConfig | undefined;

    @state()
    isLoaded: boolean = false;

    @state()
    errors: Map<string, string> = new Map<string, string>();

    @state()
    showErrors: boolean = false;

    constructor() {
        super();

        this.consumeContext(
            DEPLOYMENT_TARGET_CONTEXT_TOKEN,
            (context) => {
                this.#deploymentTargetContext = context;

                if (this.data?.content) {
                    this.#mapToPropertyValueData();
                }

                this.observe(this.#deploymentTargetContext?.config, (x) => {
                    this.config = x;
                    this.isLoaded = true;
                });
            });
    }

    //#region Render

    render() {
        return html`
            <umb-body-layout .headline=${this.data?.headline ?? 'Create new Deployment Target'}>
                <uui-box>
                <umb-property-dataset
                  .value=${this._values as Array<UmbPropertyValueData>}
                  @change=${this.#onPropertyDataChange}
                >
                  ${this.#getBaseProperties()
                .map(
                    (prop) =>

                        html`
                        <xstatic-validation-error-wrapper errorMessage=${ifDefined(this.showErrors ? this.errors.get(prop.alias) : undefined)}>
                            <umb-property
                            alias=${prop.alias}
                            label=${prop.label}
                            .description=${prop.description}
                            property-editor-ui-alias=${prop.propertyEditorUiAlias}
                            .config=${prop.config}
                            ></umb-property>
                        </xstatic-validation-error-wrapper>`
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
        if (!this._values) {
            throw new Error('No data provided');
        }

        var postModel = this.#createPostModel();

        if (!this.#validatePostModel(postModel)) {
            this.showErrors = true;
            return;
        }

        const data = postModel.id > 0
            ? await this.#deploymentTargetContext!.updateDeploymentTarget(postModel)
            : await this.#deploymentTargetContext!.createDeploymentTarget(postModel);

        if (data) {
            this.modalContext?.submit();
        }
    }

    #handleCancel() {
        this.modalContext?.reject();
    }

    #onPropertyDataChange(e: Event) {
        const value = (e.target as UmbPropertyDatasetElement).value;
        this._values = value;

        var postModel = this.#createPostModel();

        if (!this.#validatePostModel(postModel)) {
            return;
        }
    }


    // #endregion Handlers

    // #region Form

    #validatePostModel(postModel: DeploymentTargetUpdateModel): boolean {
        this.errors = new Map<string, string>();

        if (!postModel.name) {
            this.errors.set('name', 'Name is required');
        }

        if (!postModel.deployerDefinition) {
            this.errors.set('deployerDefinition', 'Deployer Definition is required');
        }

        return this.errors.size === 0;
    }

    #getBaseProperties(): PropertyEditorSettingsProperty[] {

        var selectedType = this.getFirst(this._values.find((x) => x.alias === 'deployerDefinition')?.value as Array<string>);

        var existingConfig = this._values.find((x) => x.alias === 'fields')?.value as DeployerField[] | null | undefined;
        var selectedActionType = this.config?.deployers?.find((x) => x.id === selectedType);

        var selectedConfig = this.#isExistingConfigValid(existingConfig, selectedActionType)
            ? existingConfig
            : selectedActionType?.fields;

        return [
            {
                alias: "name",
                label: "Name *",
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
                alias: "deployerDefinition",
                label: "Deployer *",
                description: "This is the type of deployer that you want to configure a specific instance of.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.Dropdown",
                config: [
                    {
                        alias: 'items',
                        value: this.config?.deployers?.map((x) => ({ name: x.name, value: x.id })) ?? []
                    },
                ],
            },
            {
                alias: "fields",
                label: "Configuration",
                description: "Use this to set what specific configuration you want to use for the selected deployer. The fields may change depending on the type selected.",
                propertyEditorUiAlias: "xstatic.propertyEditorUi.deploymentTargetForm",
                config: [
                    {
                        alias: 'fields',
                        value: selectedConfig
                    },
                ],
            },
        ];
    }

    #isExistingConfigValid(existingConfig: DeployerModel[] | null | undefined,
        selectedDeployer: DeployerModel | null | undefined) {
        if (!existingConfig || !selectedDeployer) {
            return false;
        }

        var existingFields = existingConfig;
        var selectedFields = selectedDeployer.fields;

        if (existingFields.length !== selectedFields?.length) {
            return false;
        }

        for (let i = 0; i < selectedFields.length; i++) {
            const selectedField = selectedFields[i];
            const existingField = existingFields.find((x) => x.name === selectedField.name);

            if (!existingField) {
                console.log('existingField not found', selectedField.name, existingFields);
                return false;
            }
        }

        return true;
    }

    // #endregion Form

    // #region Mappers

    #createPostModel(): DeploymentTargetUpdateModel {
        var deployerFields = this._values.find((x) => x.alias === 'fields')?.value as DeployerField[];

        var model =
            {
                name: this._values.find((x) => x.alias === 'name')?.value,
                id: this.data?.content.id,
                deployerDefinition: this.getFirst(this._values.find((x) => x.alias === 'deployerDefinition')?.value as Array<string>),
                fields: this.arrayAsRecord(deployerFields),
            } as DeploymentTargetUpdateModel;
            
        return model;
    }

    #mapToPropertyValueData() {
        const fieldsArray = this.data?.content?.fields;
        const fieldsRecord = this.arrayAsRecord(fieldsArray);

        var updateModel: DeploymentTargetUpdateModel = {
            id: this.data?.content?.id ?? 0,
            name: this.data?.content?.name,
            deployerDefinition: this.data?.content?.deployerDefinition,
            fields: fieldsRecord,
        };

        this.updateValue({ content: updateModel });

        this._values = [
            { alias: 'id', value: updateModel.id },
            { alias: 'name', value: updateModel.name },
            { alias: 'deployerDefinition', value: [updateModel.deployerDefinition] },
            { alias: 'fields', value: fieldsArray },
        ];
    }

    // #endregion Mappers

    // #region Utils

    getFirst(value: any[]) {
        return value?.length > 0 ? value[0] : null;
    }

    recordAsArray(record: Record<string, string | null> | null | undefined): { key: string, value: string | null }[] {
        if (!record) {
            return [];
        }

        let entries = Object.entries(record);
        let mapped = entries.map(([key, value]) => ({ key: key, value: value }));

        return mapped;
    }

    arrayAsRecord(array: DeployerField[] | null | undefined): Record<string, string | null> {
        var record: Record<string, string | null> = {};

        if (array) {
            array.forEach((x) => { if (x?.name) { record[x.name] = x.value ?? null } });
        }

        return record;
    }

    // #endregion Utils
}

export interface EditDeploymentTargetModalData {
    headline?: string;
    content: DeploymentTargetModel;
}

export interface EditDeploymentTargetModalValue {
    content: DeploymentTargetUpdateModel;
}

export const EditDeploymentTargetModal = new UmbModalToken<EditDeploymentTargetModalData, EditDeploymentTargetModalValue>(
    "xstatic.deploymentTargetModal",
    {
        modal: {
            type: 'sidebar',
            size: 'large',
        }
    }
);

export default EditDeploymentTargetModalElement;