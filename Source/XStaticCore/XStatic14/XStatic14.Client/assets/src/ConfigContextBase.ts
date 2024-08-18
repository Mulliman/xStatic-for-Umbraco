import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { Observable, UmbBooleanState, UmbObjectState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecuteAndNotify } from '@umbraco-cms/backoffice/resources'
import { V1Service, XStaticConfig } from "./api";

export abstract class ConfigContextBase extends UmbControllerBase {
    #isReady = new UmbBooleanState(false);
    public readonly isReady : Observable<boolean> = this.#isReady.asObservable();

    #config = new UmbObjectState<XStaticConfig>({} as XStaticConfig);
    public get config() : Observable<XStaticConfig> { return this.#initConfig(); }

    constructor(host: UmbControllerHost) {
        super(host);
    }

    refreshData() {
        this.#isReady.setValue(false);
        this.#initConfig();
    }

    #initConfig() : Observable<XStaticConfig> {
        if(!this.#isReady.getValue()){
            this.getConfig();
        }

        return this.#config.asObservable();
    }
    
    async getConfig() {
        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticConfigGetConfig());

        if(data){
            this.#config.setValue(data);
            this.#isReady.setValue(true);
        }
    }
}

export default ConfigContextBase;