import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { Observable, UmbArrayState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecuteAndNotify } from '@umbraco-cms/backoffice/resources'
import { DeploymentTargetModel, DeploymentTargetUpdateModel, V1Service } from "../../api";
import { umbConfirmModal } from "@umbraco-cms/backoffice/modal";
import ConfigContextBase from "../../ConfigContextBase";

export class DeploymentTargetContext extends ConfigContextBase {

    isTargetsLoaded: boolean = false;

    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(DEPLOYMENT_TARGET_CONTEXT_TOKEN, this);
    }

    #deploymentTargets = new UmbArrayState<DeploymentTargetModel>([], (x) => x.id);
    public get deploymentTargets() : Observable<DeploymentTargetModel[]> { return this.#initDeploymentTargets(); }

    public async createDeploymentTarget(action: DeploymentTargetUpdateModel) : Promise<DeploymentTargetModel | null> {
        const { data } = await tryExecuteAndNotify(this, V1Service.postApiV1XstaticDeploymentTargetsCreateDeploymentTarget({ requestBody: action }));

        if(data){
            await this.#getDeploymentTargets();

            return data;
        }

        return null;
    }

    public async updateDeploymentTarget(action: DeploymentTargetUpdateModel) : Promise<DeploymentTargetModel | null> {
        const { data } = await tryExecuteAndNotify(this, V1Service.postApiV1XstaticDeploymentTargetsUpdateDeploymentTarget({ requestBody: action }));

        if(data){
            await this.#getDeploymentTargets();

            return data;
        }

        return null;
    }

    public async deleteDeploymentTarget(id: number) : Promise<void> {
        await umbConfirmModal(this, {
            color: 'danger',
            headline: 'Delete Deployment Target',
            content: 'Are you sure you want to delete this Deployment Target?',
            confirmLabel: 'Delete',
        });

        await tryExecuteAndNotify(this, V1Service.deleteApiV1XstaticDeploymentTargetsDeleteDeploymentTarget({ id : id } ));
        await this.#getDeploymentTargets();
    }

    #initDeploymentTargets() : Observable<DeploymentTargetModel[]> {
        if(!this.isTargetsLoaded){
            this.#getDeploymentTargets();
        }

        return this.#deploymentTargets.asObservable();
    }

    async #getDeploymentTargets() {
        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticDeploymentTargetsGetDeploymentTargets());

        if(data){
            this.#deploymentTargets.setValue(data);
            this.isTargetsLoaded = true;
        }
    }
}

export default DeploymentTargetContext;

export const DEPLOYMENT_TARGET_CONTEXT_TOKEN = new UmbContextToken<DeploymentTargetContext>("xStatic.DeploymentTargetContext");