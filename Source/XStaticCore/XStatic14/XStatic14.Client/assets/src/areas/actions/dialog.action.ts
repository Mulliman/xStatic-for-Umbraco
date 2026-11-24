import { customElement, html, state, type PropertyValues } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement, UmbModalToken } from "@umbraco-cms/backoffice/modal";
import { ActionModel, ActionUpdateModel, XStaticConfig } from "../../api";
import { UmbPropertyDatasetElement, UmbPropertyValueData } from "@umbraco-cms/backoffice/property";
import ActionContext, { ACTION_CONTEXT_TOKEN } from "./context.action";
import { renderFormDialog } from "../../elements/form-dialog";
import type { XStaticFormErrors, XStaticFormProperty } from "../../code/form";
import {
    buildActionFormProperties,
    getSelectedActionTypeId,
    mapActionToFormValues,
    mapActionToUpdateModel,
    mapFormValuesToActionUpdate,
    validateActionUpdate,
} from "./action-form";

@customElement('xstatic-edit-action-modal')
export class EditActionModalElement extends
    UmbModalBaseElement<EditActionModalData, EditActionModalValue>
{
    #actionContext?: ActionContext;

    @state()
    values: Array<UmbPropertyValueData> = [];

    @state()
    config: XStaticConfig | undefined;

    @state()
    isLoaded: boolean = false;

    @state()
    errors: XStaticFormErrors = new Map();

    @state()
    showErrors: boolean = false;

    /** Rebuilt when the config or the selected action type changes, not on every render or keystroke. */
    @state()
    private _properties: XStaticFormProperty[] = [];

    #propertiesKey?: string | null;

    constructor() {
        super();

        this.consumeContext(ACTION_CONTEXT_TOKEN, (context) => {
            this.#actionContext = context;

            if (this.data?.content) {
                this.updateValue({ content: mapActionToUpdateModel(this.data.content) });
                this.values = mapActionToFormValues(this.data.content);
            }

            this.observe(context?.config, (x) => {
                this.config = x;
                this.isLoaded = true;
            }, '_observeConfig');
        });
    }

    protected override willUpdate(changed: PropertyValues): void {
        super.willUpdate(changed);

        const selectedTypeId = getSelectedActionTypeId(this.values);

        if (changed.has('config') || selectedTypeId !== this.#propertiesKey) {
            this.#propertiesKey = selectedTypeId;
            this._properties = buildActionFormProperties(this.config, this.values);
        }
    }

    //#region Render

    render() {
        if (!this.isLoaded) {
            return html`<uui-loader-bar></uui-loader-bar>`;
        }

        return renderFormDialog({
            headline: this.data?.headline ?? 'Create new Action',
            properties: this._properties,
            values: this.values,
            errors: this.showErrors ? this.errors : undefined,
            submitLabel: 'Submit',
            onChange: this.#onPropertyDataChange,
            onSubmit: this.#handleConfirm,
            onCancel: this.#handleCancel,
        });
    }

    // #endregion Render

    // #region Handlers

    #handleConfirm = async () => {
        const postModel = mapFormValuesToActionUpdate(this.values, this.data?.content?.id);
        this.errors = validateActionUpdate(postModel);

        if (this.errors.size > 0) {
            this.showErrors = true;
            return;
        }

        const data = postModel.id > 0
            ? await this.#actionContext?.updateAction(postModel)
            : await this.#actionContext?.createAction(postModel);

        if (data) {
            this.modalContext?.submit();
        }
    };

    #handleCancel = () => {
        this.modalContext?.reject();
    };

    #onPropertyDataChange = (e: Event) => {
        this.values = (e.target as UmbPropertyDatasetElement).value;
        this.errors = validateActionUpdate(mapFormValuesToActionUpdate(this.values, this.data?.content?.id));
    };

    // #endregion Handlers
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
