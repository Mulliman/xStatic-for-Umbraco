import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { Observable, UmbArrayState, UmbObjectState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecuteAndNotify } from '@umbraco-cms/backoffice/resources'
import { DeploymentTargetModel, DeploymentTargetUpdateModel, V1Service, XStaticConfig } from "../../api";
import { umbConfirmModal } from "@umbraco-cms/backoffice/modal";

export class DeploymentTargetContext extends UmbControllerBase {
    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(DEPLOYMENT_TARGET_CONTEXT_TOKEN, this);
    }

    #config = new UmbObjectState<XStaticConfig>({} as XStaticConfig);
    public readonly config : Observable<XStaticConfig> = this.#config.asObservable();

    #deploymentTargets = new UmbArrayState<DeploymentTargetModel>([], (x) => x.id);
    public readonly deploymentTargets : Observable<DeploymentTargetModel[]> = this.#deploymentTargets.asObservable();

    public async getConfig() {
        console.log('fetching config');

        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticConfigGetConfig());

        if(data){
            console.log('data', data);

            this.#config.setValue(data);
        }
    }

    public async getDeploymentTargets() {
        console.log('fetching deployment targets');

        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticDeploymentTargetsGetDeploymentTargets());

        if(data){
            this.#deploymentTargets.setValue(data);
        }
    }

    public async createDeploymentTarget(action: DeploymentTargetUpdateModel) : Promise<DeploymentTargetModel | null> {
        console.log('creating deployment target', action);

        const { data } = await tryExecuteAndNotify(this, V1Service.postApiV1XstaticDeploymentTargetsCreateDeploymentTarget({ requestBody: action }));

        if(data){
            await this.getDeploymentTargets();

            return data;
        }

        return null;
    }

    public async updateDeploymentTarget(action: DeploymentTargetUpdateModel) : Promise<DeploymentTargetModel | null> {
        console.log('updating deployment target', action);

        const { data } = await tryExecuteAndNotify(this, V1Service.postApiV1XstaticDeploymentTargetsUpdateDeploymentTarget({ requestBody: action }));

        if(data){
            await this.getDeploymentTargets();

            return data;
        }

        return null;
    }

    public async deleteDeploymentTarget(id: number) : Promise<void> {
        console.log('deleting deployment target', id);

        await umbConfirmModal(this, {
            color: 'danger',
            headline: 'Delete Deployment Target',
            content: 'Are you sure you want to delete this Deployment Target?',
            confirmLabel: 'Delete',
        });

        await tryExecuteAndNotify(this, V1Service.deleteApiV1XstaticDeploymentTargetsDeleteDeploymentTarget({ id : id } ));
        await this.getDeploymentTargets();
    }
}

export default DeploymentTargetContext;

export const DEPLOYMENT_TARGET_CONTEXT_TOKEN = new UmbContextToken<DeploymentTargetContext>(DeploymentTargetContext.name);