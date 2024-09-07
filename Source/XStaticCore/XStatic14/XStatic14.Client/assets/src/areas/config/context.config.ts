import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import ConfigContextBase from "../../config-context-base";
import { Observable, UmbBooleanState, UmbObjectState } from "@umbraco-cms/backoffice/observable-api";
import { V1Service, XStaticSettings } from "../../api";
import { tryExecuteAndNotify } from "@umbraco-cms/backoffice/resources";

export class ConfigContext extends ConfigContextBase {
    constructor(host: UmbControllerHost) {
        super(host);

        this.#initSettings();

        this.provideContext(CONFIG_CONTEXT_TOKEN, this);
    }

    #isSettingsReady = new UmbBooleanState(false);
    public readonly isSettingsReady : Observable<boolean> = this.#isSettingsReady.asObservable();

    #settings = new UmbObjectState<XStaticSettings>({} as XStaticSettings);
    public get settings() : Observable<XStaticSettings> { return this.#initSettings(); }

    #initSettings() : Observable<XStaticSettings> {
        if(!this.#isSettingsReady.getValue()){
            this.getSettings();
        }

        return this.#settings.asObservable();
    }
    
    async getSettings() {
        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticConfigGetSettings());

        if(data){
            this.#settings.setValue(data);
            this.#isSettingsReady.setValue(true);
        }
    }
}

export default ConfigContext;

export const CONFIG_CONTEXT_TOKEN = new UmbContextToken<ConfigContext>("xStatic.ConfigContext");