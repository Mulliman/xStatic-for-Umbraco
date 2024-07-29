import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { Observable, UmbArrayState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecuteAndNotify } from '@umbraco-cms/backoffice/resources'
import { SiteApiModel, SiteUpdateModel, V1Service } from "../../api";

export class SiteContext extends UmbControllerBase {
    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(SITE_CONTEXT_TOKEN, this);
    }

    #sites = new UmbArrayState<SiteApiModel>([], (x) => x.id);
    public readonly sites : Observable<SiteApiModel[]> = this.#sites.asObservable();

    public async getSites() {
        console.log('fetching sites proper');

        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticGetAll());

        if(data){
            this.#sites.setValue(data);
        }
    }

    public async createSite(site: SiteUpdateModel) : Promise<SiteApiModel | null> {
        console.log('creating site', site);

        const { data } = await tryExecuteAndNotify(this, V1Service.postApiV1XstaticCreate({ requestBody: site }));

        if(data){
            await this.getSites();

            return data;
        }

        return null;
    }

    public async updateSite(site: SiteUpdateModel) : Promise<SiteApiModel | null> {
        console.log('updating site', site);

        const { data } = await tryExecuteAndNotify(this, V1Service.postApiV1XstaticUpdate({ requestBody: site }));

        if(data){
            await this.getSites();

            return data;
        }

        return null;
    }
}

export default SiteContext;

export const SITE_CONTEXT_TOKEN = new UmbContextToken<SiteContext>(SiteContext.name);