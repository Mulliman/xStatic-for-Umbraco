import { customElement, html, property, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement } from "@umbraco-cms/backoffice/modal";

import { UmbModalToken } from "@umbraco-cms/backoffice/modal";
import { SiteApiModel, SiteUpdateModel, V1Service } from "../../api";
import { UmbPropertyDatasetElement, UmbPropertyValueData } from "@umbraco-cms/backoffice/property";
import { PropertyEditorSettingsProperty } from "@umbraco-cms/backoffice/extension-registry";
import { tryExecuteAndNotify } from "@umbraco-cms/backoffice/resources";

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

@customElement('xstatic-edit-site-modal')
export class EditSiteModalElement extends
    UmbModalBaseElement<EditSiteModalData, EditSiteModalValue>
{
    constructor() {
        super();
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.updateValue({ content: this.data?.content });

        if(this.data?.content) {
            var model = this.data!.content;

            this._values = [
                { alias: 'name', value: model.name },
                { alias: 'rootNode', value: [{ unique: model.rootNode }] },
                { alias: 'mediaRootNodes', value: model.mediaRootNodes?.map(x => ({ key: x, mediaKey: x, unique: x })) },
                { alias: 'exportFormat', value: model.exportFormat },
                { alias: 'assetPaths', value: model.assetPaths?.split(',') },
                { alias: 'imageCrops', value: model.imageCrops?.split(',') },
                { alias: 'postGenerationActionIds', value: model.postGenerationActionIds },
                { alias: 'autoPublish', value: model.autoPublish },
                { alias: 'deploymentTarget', value: model.deploymentTarget },
                { alias: 'targetHostname', value: model.targetHostname },
            ];

            console.log('values', this._values);

            // this._values = Object.keys(model).map((fieldName) => ({
            //     alias: fieldName,
            //     value: (model as any)[fieldName],
            // } as UmbPropertyValueData));
        }
    }

    @state()
    content: SiteApiModel = {} as SiteApiModel;

    @state() 
    _values: Array<UmbPropertyValueData> = [];

    async #handleConfirm() {
        if (!this._values) {
            throw new Error('No data provided');
        }

        // this.value = { content: this.data?.content };

        var postModel = this.createPostModel();

        const { data } = postModel.id > 0
            ? await tryExecuteAndNotify(this, V1Service.postApiV1XstaticUpdate({ requestBody: postModel }))
            : await tryExecuteAndNotify(this, V1Service.postApiV1XstaticCreate({ requestBody: postModel }));

        if(data) {
            this.modalContext?.submit();
        }
    }

    createCsvString(value: any[]) {
        return value?.length > 0 ? value.join(',') : null;
    }
    
    createPostModel() : SiteUpdateModel {

        console.log('values', this._values);

        var rootNodes = this._values?.find((x) => x.alias === 'rootNode')?.value as Array<any>;
        var rootNodeId = rootNodes ? rootNodes[0]?.unique as string : null;

        var mediaRootNodes = this._values?.find((x) => x.alias === 'mediaRootNodes')?.value as Array<any>;
        var mediaRootNodeIds = mediaRootNodes?.map(x => x?.mediaKey) as string[];

        var model = 
        {
            autoPublish: this._values.find((x) => x.alias === 'autoPublish')?.value,
            assetPaths: this.createCsvString(this._values.find((x) => x.alias === 'assetPaths')?.value as string[]),
            deploymentTarget: this._values.find((x) => x.alias === 'deploymentTarget')?.value,
            exportFormat: this._values.find((x) => x.alias === 'exportFormat')?.value,
            imageCrops: this.createCsvString(this._values.find((x) => x.alias === 'imageCrops')?.value as string[]),
            mediaRootNodes: mediaRootNodeIds,
            postGenerationActionIds: this._values.find((x) => x.alias === 'postGenerationActionIds')?.value,
            rootNode: rootNodeId,
            targetHostname: this._values.find((x) => x.alias === 'targetHostname')?.value,
            id: this.data?.content.id,
            name: this._values.find((x) => x.alias === 'name')?.value,
        } as SiteUpdateModel;

        return model;
    }

    #handleCancel() {
        this.modalContext?.reject();
    }

    baseProperties: PropertyEditorSettingsProperty[] = [
        {
            alias: "name",
            label: "Site Name",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.TextBox"
        },
        {
            alias: "rootNode",
            label: "Root Node",
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
            label: "Export Format",
            description: "Do you want to export this site as a JSON API or as a static HTML website.",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.Dropdown",
            config: [
                {
                    alias: "items",
                    value: ["hi", "hello"],
                },
            ],
        },
        {
            alias: "assetPaths",
            label: "Asset Paths",
            description: "Add folder names of files on disk that should also be packaged up. e.g. /assets/js,/assets/css",
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
                    value: ["hi", "hello"],
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
            description: "Configure your deployment target by filling in all required settings.",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.Dropdown",
            config: [
                {
                    alias: "items",
                    value: ["hi", "hello"],
                },
            ],
        },
        {
            alias: "targetHostname",
            label: "Target Hostname",
            description: "The site hostname you've configured for viewing the site locally will be replaced with this value.",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.TextBox",
        }
    ];

    #onPropertyValueChange(e: Event) {
        const newValue = (e.target as UmbPropertyDatasetElement).value;
        this.baseProperties = this.baseProperties.map((p) => ({
            ...p,
            ...{ value: newValue.find((x) => x.alias === p.alias)?.value },
        }));

        this.requestUpdate();
    }

    #onPropertyDataChange(e: Event) {
        // Grab the value
        const value = (e.target as UmbPropertyDatasetElement).value;
        // Convert the value back into an object
        // var data = value.reduce((acc, curr)=>({...acc, [curr.alias]: curr.value}), {});
        // Update our model
        this._values = value;

        console.log('values', this._values);
    }

    render() {
        return html`
            <umb-body-layout .headline=${this.data?.headline ?? 'Create new site'}>
                <uui-box>
                <umb-property-dataset
                  .value=${this._values as Array<UmbPropertyValueData>}
                  @change=${this.#onPropertyDataChange}
                >
                  ${this.baseProperties
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
                <uui-box>
                    <h2>Return Value</h2>
                    <pre>${this.baseProperties.map((x: any) => x.value)}</pre>
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

export default EditSiteModalElement;