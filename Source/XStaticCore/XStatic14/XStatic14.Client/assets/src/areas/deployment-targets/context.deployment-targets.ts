import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { Observable, UmbArrayState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecute } from '@umbraco-cms/backoffice/resources'
import { UMB_NOTIFICATION_CONTEXT } from '@umbraco-cms/backoffice/notification';
import { DeploymentTargetCreatorPostModel, DeploymentTargetModel, DeploymentTargetUpdateModel, V1Service } from "../../api";
import { umbConfirmModal } from "@umbraco-cms/backoffice/modal";
import ConfigContextBase from "../../config-context-base";
import { notifyConfigChanged } from "../../code/config-changes";
import { getApiErrorMessage } from "../../code/api-error-message";

const AUTO_CREATE_FALLBACK_MESSAGE = 'The deployment target could not be created. Check the Umbraco logs for details.';

export class DeploymentTargetContext extends ConfigContextBase {

    isTargetsLoaded: boolean = false;

    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(DEPLOYMENT_TARGET_CONTEXT_TOKEN, this);
    }

    #deploymentTargets = new UmbArrayState<DeploymentTargetModel>([], (x) => x.id);
    public get deploymentTargets() : Observable<DeploymentTargetModel[]> { return this.#initDeploymentTargets(); }

    public async autoCreateDeploymentTarget(action: DeploymentTargetCreatorPostModel) : Promise<DeploymentTargetModel | null> {
        // A failed create returns its reason in the body's `message`, which Umbraco's default error notification
        // doesn't show, so notifications are turned off here and the reason is shown instead.
        const data = await tryExecute(
            this,
            V1Service.postApiV1XstaticDeploymentTargetsAutoCreateDeploymentTarget({ requestBody: action }),
            { disableNotifications: true });

        if(!data?.error && data?.wasSuccessful && data.data){
            await this.#getDeploymentTargets();
            notifyConfigChanged();

            return data.data;
        }

        if (data?.error?.name === 'UmbCancelError') {
            return null;
        }

        const message = data?.error
            ? getApiErrorMessage(data.error, AUTO_CREATE_FALLBACK_MESSAGE)
            : data?.message?.trim() || AUTO_CREATE_FALLBACK_MESSAGE;

        const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
        notificationContext?.peek('danger', {
            data: { headline: 'Could not create the deployment target', message }
        });

        return null;
    }

    public async createDeploymentTarget(action: DeploymentTargetUpdateModel) : Promise<DeploymentTargetModel | null> {
        const data = await tryExecute(this, V1Service.postApiV1XstaticDeploymentTargetsCreateDeploymentTarget({ requestBody: action }));

        if(data){
            await this.#getDeploymentTargets();
            notifyConfigChanged();

            return data;
        }

        return null;
    }

    public async updateDeploymentTarget(action: DeploymentTargetUpdateModel) : Promise<DeploymentTargetModel | null> {
        const data = await tryExecute(this, V1Service.postApiV1XstaticDeploymentTargetsUpdateDeploymentTarget({ requestBody: action }));

        if(data){
            await this.#getDeploymentTargets();
            notifyConfigChanged();

            return data;
        }

        return null;
    }

    public async deleteDeploymentTarget(id: number) : Promise<void> {
        try {
            await umbConfirmModal(this, {
                color: 'danger',
                headline: 'Delete Deployment Target',
                content: 'Are you sure you want to delete this Deployment Target?',
                confirmLabel: 'Delete',
            });
        } catch {
            return;
        }

        await tryExecute(this, V1Service.deleteApiV1XstaticDeploymentTargetsDeleteDeploymentTarget({ id : id } ));
        await this.#getDeploymentTargets();
        notifyConfigChanged();
    }

    #initDeploymentTargets() : Observable<DeploymentTargetModel[]> {
        if(!this.isTargetsLoaded){
            this.#getDeploymentTargets();
        }

        return this.#deploymentTargets.asObservable();
    }

    async #getDeploymentTargets() {
        const data = await tryExecute(this, V1Service.getApiV1XstaticDeploymentTargetsGetDeploymentTargets());

        if(data){
            this.#deploymentTargets.setValue(data);
            this.isTargetsLoaded = true;
        }
    }
}

export default DeploymentTargetContext;

export const DEPLOYMENT_TARGET_CONTEXT_TOKEN = new UmbContextToken<DeploymentTargetContext>("xStatic.DeploymentTargetContext");