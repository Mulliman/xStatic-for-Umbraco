import { customElement, state, type PropertyValues } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement, UmbModalToken } from "@umbraco-cms/backoffice/modal";
import { ExportTypeModel, ExportTypeUpdateModel, XStaticConfig } from "../../api";
import { UmbPropertyDatasetElement, UmbPropertyValueData } from "@umbraco-cms/backoffice/property";
import ExportTypeContext, { EXPORT_TYPE_CONTEXT_TOKEN } from "./context.export-type";
import { renderFormDialog } from "../../elements/form-dialog";
import type { XStaticFormErrors, XStaticFormProperty } from "../../code/form";
import {
    buildExportTypeFormProperties,
    mapExportTypeToFormValues,
    mapExportTypeToUpdateModel,
    mapFormValuesToExportTypeUpdate,
    validateExportTypeUpdate,
} from "./export-type-form";

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
    _values: Array<UmbPropertyValueData> = [];

    @state()
    config: XStaticConfig | undefined;

    @state()
    errors: XStaticFormErrors = new Map();

    @state()
    showErrors: boolean = false;

    /** Rebuilt only when the config changes, not on every render. */
    @state()
    private _properties: XStaticFormProperty[] = [];

    constructor() {
        super();

        this.consumeContext(EXPORT_TYPE_CONTEXT_TOKEN, (context) => {
            this.#exportTypeContext = context;

            if (this.data?.content) {
                this.updateValue({ content: mapExportTypeToUpdateModel(this.data.content) });
                this._values = mapExportTypeToFormValues(this.data.content);
            }

            this.observe(context?.config, (x) => {
                this.config = x;
            }, '_observeConfig');
        });
    }

    protected override willUpdate(changed: PropertyValues): void {
        super.willUpdate(changed);

        if (changed.has('config') || this._properties.length === 0) {
            this._properties = buildExportTypeFormProperties(this.config);
        }
    }

    render() {
        return renderFormDialog({
            headline: this.data?.headline ?? 'Create new export type',
            properties: this._properties,
            values: this._values,
            errors: this.showErrors ? this.errors : undefined,
            submitLabel: 'Submit',
            onChange: this.#onPropertyDataChange,
            onSubmit: this.#handleConfirm,
            onCancel: this.#handleCancel,
        });
    }

    #handleConfirm = async () => {
        const postModel = this.createPostModel();
        this.errors = validateExportTypeUpdate(postModel);

        if (this.errors.size > 0) {
            this.showErrors = true;
            return;
        }

        const data = postModel.id > 0
            ? await this.#exportTypeContext?.updateExportType(postModel)
            : await this.#exportTypeContext?.createExportType(postModel);

        if (data) {
            this.modalContext?.submit();
        }
    };

    #handleCancel = () => {
        this.modalContext?.reject();
    };

    #onPropertyDataChange = (e: Event) => {
        this._values = (e.target as UmbPropertyDatasetElement).value;
        this.errors = validateExportTypeUpdate(this.createPostModel());
    };

    /** The model that Submit sends, built from the current form values. */
    createPostModel(): ExportTypeUpdateModel {
        return mapFormValuesToExportTypeUpdate(this._values, this.data?.content?.id);
    }
}

export default EditExportTypeModalElement;
