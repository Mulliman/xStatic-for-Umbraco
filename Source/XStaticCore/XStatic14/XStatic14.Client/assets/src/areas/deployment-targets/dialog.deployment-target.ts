import { customElement, state, type PropertyValues } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement, UmbModalToken } from "@umbraco-cms/backoffice/modal";
import { DeploymentTargetModel, DeploymentTargetUpdateModel, XStaticConfig } from "../../api";
import { UmbPropertyDatasetElement, UmbPropertyValueData } from "@umbraco-cms/backoffice/property";
import DeploymentTargetContext, { DEPLOYMENT_TARGET_CONTEXT_TOKEN } from "./context.deployment-targets";
import { renderFormDialog } from "../../elements/form-dialog";
import type { XStaticFormErrors, XStaticFormProperty } from "../../code/form";
import {
    buildDeploymentTargetFormProperties,
    getSelectedDeployerId,
    mapDeploymentTargetToFormValues,
    mapDeploymentTargetToUpdateModel,
    mapFormValuesToDeploymentTargetUpdate,
    validateDeploymentTargetUpdate,
} from "./deployment-target-form";

@customElement('xstatic-edit-deployment-target-modal')
export class EditDeploymentTargetModalElement extends
    UmbModalBaseElement<EditDeploymentTargetModalData, EditDeploymentTargetModalValue>
{
    #deploymentTargetContext?: DeploymentTargetContext;

    @state()
    _values: Array<UmbPropertyValueData> = [];

    @state()
    config: XStaticConfig | undefined;

    @state()
    errors: XStaticFormErrors = new Map();

    @state()
    showErrors: boolean = false;

    /** Rebuilt when the config or the selected deployer changes, not on every render or keystroke. */
    @state()
    private _properties: XStaticFormProperty[] = [];

    #propertiesKey?: string | null;

    constructor() {
        super();

        this.consumeContext(DEPLOYMENT_TARGET_CONTEXT_TOKEN, (context) => {
            this.#deploymentTargetContext = context;

            if (this.data?.content) {
                this.updateValue({ content: mapDeploymentTargetToUpdateModel(this.data.content) });
                this._values = mapDeploymentTargetToFormValues(this.data.content);
            }

            this.observe(context?.config, (x) => {
                this.config = x;
            }, '_observeConfig');
        });
    }

    protected override willUpdate(changed: PropertyValues): void {
        super.willUpdate(changed);

        const selectedId = getSelectedDeployerId(this._values);

        if (changed.has('config') || selectedId !== this.#propertiesKey) {
            this.#propertiesKey = selectedId;
            this._properties = buildDeploymentTargetFormProperties(this.config, this._values);
        }
    }

    render() {
        return renderFormDialog({
            headline: this.data?.headline ?? 'Create new Deployment Target',
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
        const postModel = mapFormValuesToDeploymentTargetUpdate(this._values, this.data?.content?.id);
        this.errors = validateDeploymentTargetUpdate(postModel);

        if (this.errors.size > 0) {
            this.showErrors = true;
            return;
        }

        const data = postModel.id > 0
            ? await this.#deploymentTargetContext?.updateDeploymentTarget(postModel)
            : await this.#deploymentTargetContext?.createDeploymentTarget(postModel);

        if (data) {
            this.modalContext?.submit();
        }
    };

    #handleCancel = () => {
        this.modalContext?.reject();
    };

    #onPropertyDataChange = (e: Event) => {
        this._values = (e.target as UmbPropertyDatasetElement).value;
        this.errors = validateDeploymentTargetUpdate(mapFormValuesToDeploymentTargetUpdate(this._values, this.data?.content?.id));
    };
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
