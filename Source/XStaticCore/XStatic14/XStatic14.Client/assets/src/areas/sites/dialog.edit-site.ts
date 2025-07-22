import { customElement, html, ifDefined, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement } from "@umbraco-cms/backoffice/modal";

import { UmbModalToken } from "@umbraco-cms/backoffice/modal";
import { SafeActionModel, SafeDeploymentTargetModel, SiteApiModel, SiteUpdateModel, XStaticConfig } from "../../api";
import { UmbPropertyDatasetElement, UmbPropertyValueData } from "@umbraco-cms/backoffice/property";
// import { PropertyEditorSettingsProperty } from "@umbraco-cms/backoffice/extension-registry";
import SiteContext, { SITE_CONTEXT_TOKEN } from "./context.site";
import { UmbLanguageCollectionRepository, UmbLanguageDetailModel } from "@umbraco-cms/backoffice/language";

import "../../elements/element.validation-error";

@customElement('xstatic-edit-site-modal')
export class EditSiteModalElement extends
    UmbModalBaseElement<EditSiteModalData, EditSiteModalValue>
{
    #languageRepository = new UmbLanguageCollectionRepository(this);
    #siteContext?: SiteContext;

    @state()
    content: SiteApiModel = {} as SiteApiModel;

    @state()
    _values: Array<UmbPropertyValueData> = [];

    @state()
    config: XStaticConfig | undefined;

    @state()
    actions: SafeActionModel[] | undefined;

    @state()
    deploymentTargets: SafeDeploymentTargetModel[] | undefined;

    @state()
    isReady: boolean = false;

	@state()
	private _cultures: Array<UmbLanguageDetailModel> = [];

    @state()
    errors: Map<string, string> = new Map<string, string>();

    @state()
    showErrors: boolean = false;

    constructor() {
        super();

        this.consumeContext(
            SITE_CONTEXT_TOKEN,
            (context) => {
                this.#siteContext = context;

                this.observe(this.#siteContext?.siteDependencies, (x) => {
                    this.actions = x?.actions ?? [];
                    this.deploymentTargets = x?.deployers ?? [];

                    this.updateValue({ content: this.data?.content });

                    if (this.data?.content) {
                        this.#mapToPropertyValueData();
                    }
                });

                this.observe(this.#siteContext?.config, (x) => {
                    this.config = x;
                });
            }
        );
    }

    // #region init

    override connectedCallback() {
		super.connectedCallback();
		this.#getCultures();
	}

    async #getCultures() {
		const { data: langauges } = await this.#languageRepository.requestCollection({ skip: 0, take: 100 });
		this._cultures = langauges?.items ?? [];
	}

    // #endregion init

    //#region Render

    render() {

        if (!this.config || !this.actions || !this.deploymentTargets) {
            return html``;
        }

        return html`
            <umb-body-layout .headline=${this.data?.headline ?? 'Create new site'}>
                <uui-box>
                <umb-property-dataset
                  .value=${this._values as Array<UmbPropertyValueData>}
                  @change=${this.#onPropertyDataChange}
                >
                  ${this.getBaseProperties()
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
                        </xstatic-validation-error-wrapper>
                        `
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

        var postModel = this.createPostModel();

        if (!this.#validatePostModel(postModel)) {
            this.showErrors = true;
            return;
        }

        const data = postModel.id > 0
            ? await this.#siteContext!.updateSite(postModel)
            : await this.#siteContext!.createSite(postModel);

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

        var postModel = this.createPostModel();

        if (!this.#validatePostModel(postModel)) {
            return;
        }
    }

    // #endregion Handlers

    // #region Form

    #validatePostModel(postModel: SiteUpdateModel): boolean {
        this.errors = new Map<string, string>();

        if (!postModel.name) {
            this.errors.set('name', 'Name is required');
        }

        if (!postModel.rootNode) {
            this.errors.set('rootNode', 'Root node is required');
        }

        if (!postModel.exportFormat) {
            this.errors.set('exportFormat', 'Export format is required');
        }

        return this.errors.size === 0;
    }

    getBaseProperties(): any[] {
        return [
            {
                alias: "name",
                label: "Site Name *",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.TextBox"
            },
            {
                alias: "rootNode",
                label: "Root Node *",
                description: "Select the root of the site you want to create a static version of.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.ContentPicker",
                config: [
                    {
                        alias: "maxNumber",
                        value: 1,
                    },
                ],
            },
            {
                alias: "cultures",
                label: "Cultures",
                description: "Choose which language variant(s) should be used. Leave blank to use the default language.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.CheckBoxList",
                config: [
                    {
                        alias: "items",
                        value: this._cultures?.map((x) => ({ name: x.name, value: x.unique })) ?? []
                    },
                ],
            },
            {
                alias: "mediaRootNodes",
                label: "Media Root Nodes",
                description: "Select the media folders you want to include in your static site.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.MediaPicker",
                config: [
                    {
                        alias: 'multiple',
                        value: true,
                    },
                ],
            },
            {
                alias: "exportFormat",
                label: "Export Format *",
                description: "Do you want to export this site as a JSON API or as a static HTML website.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.Dropdown",
                config: [
                    {
                        alias: "items",
                        value: this.config?.exportTypes?.map((x) => ({ name: x.name, value: x.id?.toString() })) ?? []
                    },
                ],
            },
            {
                alias: "assetPaths",
                label: "Asset Paths",
                description: "Add folder names of files on disk that should also be packaged up. e.g. /assets/file.js will include the specific file, /assets will include the entire folder, /assets/* will recursively include all folders and files.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.Tags",
                config: [
                    {
                        alias: "storageType",
                        value: "csv", // Not currently working
                    },
                ],
            },
            {
                alias: "imageCrops",
                label: "Image Crops",
                description: "The image crops you want to generate in the format {width}x{height}. You can also optionally add compression after each with @{quality}. E.g. 1600x900@80,800x450@50,320x0",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.Tags",
                config: [
                    {
                        alias: "storageType",
                        value: "csv", // Not currently working
                    },
                ],
            },
            {
                alias: "postGenerationActionIds",
                label: "Post Generation Actions",
                description: "Choose which actions should be performed once the pages have been created.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.CheckBoxList",
                config: [
                    {
                        alias: "items",
                        value: this.actions?.map((x) => ({ name: x.name, value: x.id?.toString() })) ?? []
                    },
                ],
            },
            {
                alias: "autoPublish",
                label: "Auto Publish",
                description: "Select this is you want to generate the site automatically when a node is published.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.Toggle",
            },
            {
                alias: "deploymentTarget",
                label: "Deployment Target",
                description: "Create and configure your Deployment Targets in the corresponding dashboard, before choosing here.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.Dropdown",
                config: [
                    {
                        alias: "items",
                        value: this.deploymentTargets?.map((x) => ({ name: x.name, value: x.id?.toString() })) ?? []
                    },
                    {
                        alias: "placeholder",
                        value: "Please select..."
                    },
                ],
            },
            {
                alias: "targetHostname",
                label: "Target Hostname",
                description: "The site hostname you've configured for viewing the site locally will be replaced with this value. Do not include the protocol, just the hostname.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.TextBox",
            }];
    }

    // #endregion Form

    // #region Mappers

    #mapToPropertyValueData() {
        var model = this.data!.content;

        this._values = [
            { alias: 'name', value: model.name },
            { alias: 'rootNode', value: [{ unique: model.rootNode }] },
            { alias: 'cultures', value: model.cultures },
            { alias: 'mediaRootNodes', value: model.mediaRootNodes?.map(x => ({ key: x, mediaKey: x, unique: x })) },
            { alias: 'exportFormat', value: [model.exportFormat?.toString()] },
            { alias: 'assetPaths', value: model.assetPaths?.split(',') },
            { alias: 'imageCrops', value: model.imageCrops?.split(',') },
            { alias: 'postGenerationActionIds', value: model.postGenerationActionIds?.map(x => x.toString()) },
            { alias: 'autoPublish', value: model.autoPublish },
            { alias: 'deploymentTarget', value: [model.deploymentTarget?.toString()] },
            { alias: 'targetHostname', value: model.targetHostname },
        ];
    }

    createPostModel(): SiteUpdateModel {
        var rootNodes = this._values?.find((x) => x.alias === 'rootNode')?.value as Array<any>;
        var rootNodeId = rootNodes ? rootNodes[0]?.unique as string : null;

        var mediaRootNodes = this._values?.find((x) => x.alias === 'mediaRootNodes')?.value as Array<any>;
        var mediaRootNodeIds = mediaRootNodes?.map(x => x?.mediaKey) as string[];

        var model =
            {
                autoPublish: this._values.find((x) => x.alias === 'autoPublish')?.value,
                assetPaths: this.createCsvString(this._values.find((x) => x.alias === 'assetPaths')?.value as string[]),
                deploymentTarget: this.getFirst(this._values.find((x) => x.alias === 'deploymentTarget')?.value as string[]),
                exportFormat: this.getFirst(this._values.find((x) => x.alias === 'exportFormat')?.value as Array<string>),
                imageCrops: this.createCsvString(this._values.find((x) => x.alias === 'imageCrops')?.value as string[]),
                mediaRootNodes: mediaRootNodeIds,
                postGenerationActionIds: this.getIds(this._values.find((x) => x.alias === 'postGenerationActionIds')?.value),
                rootNode: rootNodeId,
                targetHostname: this._values.find((x) => x.alias === 'targetHostname')?.value,
                id: this.data?.content.id,
                name: this._values.find((x) => x.alias === 'name')?.value,
                cultures: this.getIds(this._values.find((x) => x.alias === 'cultures')?.value),
            } as SiteUpdateModel;

        return model;
    }

    // #endregion Mappers

    // #region Utils

    createCsvString(value: any[]) {
        return value?.length > 0 ? value.join(',') : null;
    }

    getFirst(value: any[]) {
        return value?.length > 0 ? value[0] : null;
    }

    getIds(value: any) {
        if (!value || !Array.isArray(value)) {
            return null;
        }

        return value; //.map(x => x.value);
    }

    // #endregion Utils
}

export interface EditSiteModalData {
    headline?: string;
    content: SiteApiModel;
}

export interface EditSiteModalValue {
    content: SiteUpdateModel;
}

export const EditSiteModal = new UmbModalToken<EditSiteModalData, EditSiteModalValue>(
    "xstatic.editSiteModal",
    {
        modal: {
            type: 'sidebar',
            size: 'large',
        }
    }
);

export default EditSiteModalElement;