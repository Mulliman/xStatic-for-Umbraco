import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { Observable, UmbObjectState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecuteAndNotify } from '@umbraco-cms/backoffice/resources'
import { V1Service, XStaticConfig } from "./api";

export abstract class ConfigContextBase extends UmbControllerBase {
    isConfigLoaded: boolean = false;

    constructor(host: UmbControllerHost) {
        super(host);
    }

    #config = new UmbObjectState<XStaticConfig>({} as XStaticConfig);
    public readonly config : Observable<XStaticConfig> = this.#initConfig();

    #initConfig() : Observable<XStaticConfig> {
        console.log('init config');

        if(!this.isConfigLoaded){
            this.#getConfig();
        }

        return this.#config.asObservable();
    }
    
    async #getConfig() {
        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticConfigGetConfig());

        if(data){
            this.#config.setValue(data);
            this.isConfigLoaded = true;
        }
    }
}

export default ConfigContextBase;