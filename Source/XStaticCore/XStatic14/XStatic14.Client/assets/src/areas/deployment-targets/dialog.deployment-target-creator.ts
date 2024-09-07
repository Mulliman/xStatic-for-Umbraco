import { customElement, html, ifDefined, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement } from "@umbraco-cms/backoffice/modal";

import { UmbModalToken } from "@umbraco-cms/backoffice/modal";
import { DeployerField, DeployerModel, DeploymentTargetCreatorModel, DeploymentTargetCreatorPostModel, DeploymentTargetUpdateModel, XStaticConfig } from "../../api";
import { UmbPropertyDatasetElement, UmbPropertyValueData } from "@umbraco-cms/backoffice/property";
import { PropertyEditorSettingsProperty } from "@umbraco-cms/backoffice/extension-registry";
import DeploymentTargetContext, { DEPLOYMENT_TARGET_CONTEXT_TOKEN } from "./context.deployment-targets";

import "../../elements/element.validation-error";

@customElement('xstatic-deployment-target-creator-modal')
export class DeploymentTargetCreatorModalElement extends
    UmbModalBaseElement<DeploymentTargetCreatorModalData, DeploymentTargetCreatorModalValue>
{
    #deploymentTargetContext?: DeploymentTargetContext;

    @state()
    content: DeploymentTargetCreatorModel = {} as DeploymentTargetCreatorModel;

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

                this.observe(this.#deploymentTargetContext?.config, (x) => {
                    this.config = x;
                    this.isLoaded = true;
                });
            });
    }

    //#region Render

    render() {
        return html`
            <umb-body-layout .headline=${this.data?.headline ?? 'Automatically Create New Deployment Target'}>
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
                            label="Create"
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

        const data = await this.#deploymentTargetContext!.autoCreateDeploymentTarget(postModel);

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

    #validatePostModel(postModel: DeploymentTargetCreatorPostModel): boolean {
        this.errors = new Map<string, string>();

        if (!postModel.name) {
            this.errors.set('name', 'Name is required');
        }

        if (!postModel.creator) {
            this.errors.set('creator', 'Creator is required');
        }

        return this.errors.size === 0;
    }

    #getBaseProperties(): PropertyEditorSettingsProperty[] {

        var selectedType = this.getFirst(this._values.find((x) => x.alias === 'creator')?.value as Array<string>);

        var existingConfig = this._values.find((x) => x.alias === 'fields')?.value as DeployerField[] | null | undefined;
        var selectedActionType = this.config?.deploymentTargetCreators?.find((x) => x.id === selectedType);

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
                alias: "creator",
                label: "Creator Template *",
                description: "This is the creator that will be used to configure the remote service that you intend to deploy to.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.Dropdown",
                config: [
                    {
                        alias: 'items',
                        value: this.config?.deploymentTargetCreators?.map((x) => ({ name: x.name, value: x.id })) ?? []
                    },
                ],
            },
            {
                alias: "fields",
                label: "Configuration",
                description: "Use this to set what specific configuration you want to use for the selected creator. The fields may change depending on the type selected.",
                propertyEditorUiAlias: "xstatic.propertyEditorUi.deploymentTargetForm",
                config: [
                    {
                        alias: 'fields',
                        value: selectedConfig
                    },
                    {
                        alias: 'help',
                        value: selectedActionType?.help
                    }
                ],
            },
        ];
    }

    #isExistingConfigValid(existingConfig: DeployerField[] | null | undefined,
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
            const existingField = existingFields.find((x) => x.alias === selectedField.alias);

            if (!existingField) {
                console.log('existingField not found', selectedField.name, existingFields);
                return false;
            }
        }

        return true;
    }

    // #endregion Form

    // #region Mappers

    #createPostModel(): DeploymentTargetCreatorPostModel {
        var deployerFields = this._values.find((x) => x.alias === 'fields')?.value as DeployerField[];

        var model =
            {
                name: this._values.find((x) => x.alias === 'name')?.value,
                creator: this.getFirst(this._values.find((x) => x.alias === 'creator')?.value as Array<string>),
                fields: this.arrayAsRecord(deployerFields),
            } as DeploymentTargetCreatorPostModel;
            
        return model;
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
            array.forEach((x) => { if (x?.alias) { record[x.alias] = x.value ?? null } });
        }

        return record;
    }

    // #endregion Utils
}

export interface DeploymentTargetCreatorModalData {
    headline?: string;
    // content: DeploymentTargetModel;
}

export interface DeploymentTargetCreatorModalValue {
    content: DeploymentTargetCreatorPostModel;
}

export const DeploymentTargetCreatorModal = new UmbModalToken<DeploymentTargetCreatorModalData, DeploymentTargetCreatorModalValue>(
    "xstatic.deploymentTargetCreatorModal",
    {
        modal: {
            type: 'sidebar',
            size: 'large',
        }
    }
);

export default DeploymentTargetCreatorModalElement;