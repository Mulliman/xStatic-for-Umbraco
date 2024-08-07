import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { Observable, UmbArrayState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecuteAndNotify } from '@umbraco-cms/backoffice/resources'
import { SiteApiModel, SiteUpdateModel, V1Service } from "../../api";
import { umbConfirmModal } from "@umbraco-cms/backoffice/modal";

export class SiteContext extends UmbControllerBase {

    #isSitesLoaded: boolean = false;

    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(SITE_CONTEXT_TOKEN, this);
    }

    #sites = new UmbArrayState<SiteApiModel>([], (x) => x.id);
    public readonly sites : Observable<SiteApiModel[]> = this.#initSites();

    #initSites() : Observable<SiteApiModel[]> {
        if(!this.#isSitesLoaded){
            this.#getSites();
        }

        return this.#sites.asObservable();
    }

    async #getSites() {
        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticSitesGetAll());

        if(data){
            this.#sites.setValue(data);
            this.#isSitesLoaded = true;
        }
    }

    public async createSite(site: SiteUpdateModel) : Promise<SiteApiModel | null> {
        const { data } = await tryExecuteAndNotify(this, V1Service.postApiV1XstaticSitesCreate({ requestBody: site }));

        if(data){
            await this.#getSites();

            return data;
        }

        return null;
    }

    public async updateSite(site: SiteUpdateModel) : Promise<SiteApiModel | null> {
        const { data } = await tryExecuteAndNotify(this, V1Service.postApiV1XstaticSitesUpdate({ requestBody: site }));

        if(data){
            await this.#getSites();

            return data;
        }

        return null;
    }

    public async deleteSite(id: number) : Promise<void> {
        await umbConfirmModal(this, {
            color: 'danger',
            headline: 'Delete Site',
            content: 'Are you sure you want to delete this Site?',
            confirmLabel: 'Delete',
        });

        await tryExecuteAndNotify(this, V1Service.deleteApiV1XstaticSitesDelete({ staticSiteId : id } ));
        await this.#getSites();
    }
}

export default SiteContext;

export const SITE_CONTEXT_TOKEN = new UmbContextToken<SiteContext>(SiteContext.name);