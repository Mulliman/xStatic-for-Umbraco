import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import ConfigContextBase from "../../ConfigContextBase";

export class ConfigContext extends ConfigContextBase {
    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(CONFIG_CONTEXT_TOKEN, this);
    }
}

export default ConfigContext;

export const CONFIG_CONTEXT_TOKEN = new UmbContextToken<ConfigContext>("xStatic.ConfigContext");