import { customElement, state, type PropertyValues } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement, UmbModalToken } from "@umbraco-cms/backoffice/modal";
import { DeploymentTargetCreatorPostModel, XStaticConfig } from "../../api";
import { UmbPropertyDatasetElement, UmbPropertyValueData } from "@umbraco-cms/backoffice/property";
import DeploymentTargetContext, { DEPLOYMENT_TARGET_CONTEXT_TOKEN } from "./context.deployment-targets";
import { renderFormDialog } from "../../elements/form-dialog";
import type { XStaticFormErrors, XStaticFormProperty } from "../../code/form";
import {
    buildDeploymentTargetCreatorFormProperties,
    getSelectedCreatorId,
    mapFormValuesToCreatorPost,
    validateCreatorPost,
} from "./deployment-target-form";

@customElement('xstatic-deployment-target-creator-modal')
export class DeploymentTargetCreatorModalElement extends
    UmbModalBaseElement<DeploymentTargetCreatorModalData, DeploymentTargetCreatorModalValue>
{
    #deploymentTargetContext?: DeploymentTargetContext;

    @state()
    _values: Array<UmbPropertyValueData> = [];

    @state()
    config: XStaticConfig | undefined;

    @state()
    isLoaded: boolean = false;

    @state()
    errors: XStaticFormErrors = new Map();

    @state()
    showErrors: boolean = false;

    /** Rebuilt when the config or the selected creator changes, not on every render or keystroke. */
    @state()
    private _properties: XStaticFormProperty[] = [];

    #propertiesKey?: string | null;

    constructor() {
        super();

        this.consumeContext(DEPLOYMENT_TARGET_CONTEXT_TOKEN, (context) => {
            this.#deploymentTargetContext = context;

            this.observe(context?.config, (x) => {
                this.config = x;
                this.isLoaded = true;
            }, '_observeConfig');
        });
    }

    protected override willUpdate(changed: PropertyValues): void {
        super.willUpdate(changed);

        const selectedId = getSelectedCreatorId(this._values);

        if (changed.has('config') || selectedId !== this.#propertiesKey) {
            this.#propertiesKey = selectedId;
            this._properties = buildDeploymentTargetCreatorFormProperties(this.config, this._values);
        }
    }

    render() {
        return renderFormDialog({
            headline: this.data?.headline ?? 'Automatically Create New Deployment Target',
            properties: this._properties,
            values: this._values,
            errors: this.showErrors ? this.errors : undefined,
            submitLabel: 'Create',
            onChange: this.#onPropertyDataChange,
            onSubmit: this.#handleConfirm,
            onCancel: this.#handleCancel,
        });
    }

    #handleConfirm = async () => {
        const postModel = mapFormValuesToCreatorPost(this._values);
        this.errors = validateCreatorPost(postModel);

        if (this.errors.size > 0) {
            this.showErrors = true;
            return;
        }

        const data = await this.#deploymentTargetContext?.autoCreateDeploymentTarget(postModel);

        if (data) {
            this.modalContext?.submit();
        }
    };

    #handleCancel = () => {
        this.modalContext?.reject();
    };

    #onPropertyDataChange = (e: Event) => {
        this._values = (e.target as UmbPropertyDatasetElement).value;
        this.errors = validateCreatorPost(mapFormValuesToCreatorPost(this._values));
    };
}

export interface DeploymentTargetCreatorModalData {
    headline?: string;
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
