import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { Observable, UmbObjectState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecuteAndNotify } from '@umbraco-cms/backoffice/resources'
import { V1Service, XStaticConfig } from "../../api";

export class ConfigContext extends UmbControllerBase {
    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(CONFIG_CONTEXT_TOKEN, this);
    }

    #config = new UmbObjectState<XStaticConfig>({} as XStaticConfig);
    public readonly config : Observable<XStaticConfig> = this.#config.asObservable();

    public async getConfig() {
        console.log('fetching config');

        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticConfigGetConfig());

        if(data){
            console.log('data', data);

            this.#config.setValue(data);
        }
    }
}

export default ConfigContext;

export const CONFIG_CONTEXT_TOKEN = new UmbContextToken<ConfigContext>(ConfigContext.name);