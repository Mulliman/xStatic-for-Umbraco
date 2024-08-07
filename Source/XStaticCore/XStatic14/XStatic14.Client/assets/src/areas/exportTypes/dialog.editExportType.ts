import { customElement, html, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement } from "@umbraco-cms/backoffice/modal";

import { UmbModalToken } from "@umbraco-cms/backoffice/modal";
import { ExportTypeModel, ExportTypeUpdateModel, XStaticConfig } from "../../api";
import { UmbPropertyDatasetElement, UmbPropertyValueData } from "@umbraco-cms/backoffice/property";
import { PropertyEditorSettingsProperty } from "@umbraco-cms/backoffice/extension-registry";
import ExportTypeContext, { EXPORT_TYPE_CONTEXT_TOKEN } from "./context.exportType";

export interface EditExportTypeModalData {
    headline?: string;
    content: ExportTypeModel;
}

export interface EditExportTypeModalValue {
    content: ExportTypeUpdateModel;
}

export const EditExportTypeModal = new UmbModalToken<EditExportTypeModalData, EditExportTypeModalValue>(
    "xstatic.editExportTypeModal",
    {
        modal: {
            type: 'sidebar',
            size: 'large',
        }
    }
);

@customElement('xstatic-edit-export-type-modal')
export class EditExportTypeModalElement extends
    UmbModalBaseElement<EditExportTypeModalData, EditExportTypeModalValue>
{
    #exportTypeContext?: ExportTypeContext;

    @state()
    content: ExportTypeModel = {} as ExportTypeModel;

    @state()
    _values: Array<UmbPropertyValueData> = [];

    @state()
    config: XStaticConfig | undefined;

    @state()
    isLoaded: boolean = false;

    constructor() {
        super();

        this.consumeContext(
            EXPORT_TYPE_CONTEXT_TOKEN,
            (context) => {
                this.#exportTypeContext = context;

                if (this.data?.content) {
                    this.#mapToPropertyValueData();
                }

                this.observe(this.#exportTypeContext?.config, (x) => {
                    this.config = x;
                    this.isLoaded = true;
                });
            }
        );
    }

    //#region Render

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

    // #endregion Render

    // #region Handlers

    async #handleConfirm() {
        if (!this._values) {
            throw new Error('No data provided');
        }

        var postModel = this.createPostModel();

        const data = postModel.id > 0
            ? await this.#exportTypeContext!.updateExportType(postModel)
            : await this.#exportTypeContext!.createExportType(postModel);

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
    }

    // #endregion Handlers

    // #region Form

    getBaseProperties(): PropertyEditorSettingsProperty[] {

        return [
            {
                alias: "name",
                label: "Export Type Name",
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
                alias: "transformerFactory",
                label: "Transformer Factory",
                description: "This is the component that decides what transformers are run and in which order.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.Dropdown",
                config: [
                    {
                        alias: 'items',
                        value: this.config?.transformerFactories?.map((x) => ({ name: x.name, value: x.id })) ?? []
                    },
                ],
            },
            {
                alias: "generator",
                label: "Generator",
                description: "This is the component that creates the static files for each page.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.Dropdown",
                config: [
                    {
                        alias: 'items',
                        value: this.config?.generators?.map((x) => ({ name: x.name, value: x.id })) ?? []
                    },
                ],
            },
            {
                alias: "fileNameGenerator",
                label: "File Name Generator",
                description: "This is the component that decides the folder and the file name for each page.",
                propertyEditorUiAlias: "Umb.PropertyEditorUi.Dropdown",
                config: [
                    {
                        alias: 'items',
                        value: this.config?.fileNameGenerators?.map((x) => ({ name: x.name, value: x.id })) ?? []
                    },
                ],
            },
        ];
    }

    // #endregion Form

    // #region Mappers

    #mapToPropertyValueData() {
        var updateModel = {
            id: this.data?.content?.id ?? 0,
            name: this.data?.content?.name,
            fileNameGenerator: this.data?.content?.fileNameGenerator?.id,
            generator: this.data?.content?.generator?.id,
            transformerFactory: this.data?.content?.transformerFactory?.id,
        };

        this.updateValue({ content: updateModel });

        this._values = [
            { alias: 'id', value: updateModel.id },
            { alias: 'name', value: updateModel.name },
            { alias: 'fileNameGenerator', value: [updateModel.fileNameGenerator] },
            { alias: 'generator', value: [updateModel.generator] },
            { alias: 'transformerFactory', value: [updateModel.transformerFactory] },
        ];
    }

    createPostModel(): ExportTypeUpdateModel {
        var model =
            {
                name: this._values.find((x) => x.alias === 'name')?.value,
                id: this.data?.content.id,
                fileNameGenerator: this.getFirst(this._values.find((x) => x.alias === 'fileNameGenerator')?.value as Array<string>),
                generator: this.getFirst(this._values.find((x) => x.alias === 'generator')?.value as Array<string>),
                transformerFactory: this.getFirst(this._values.find((x) => x.alias === 'transformerFactory')?.value as Array<string>),
            } as ExportTypeUpdateModel;

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

    // #endregion Utils 
}

export default EditExportTypeModalElement;