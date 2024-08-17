import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { Observable, UmbArrayState, UmbObjectState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecuteAndNotify } from '@umbraco-cms/backoffice/resources'
import { SiteApiModel, SiteDependenciesModel, SiteUpdateModel, V1Service } from "../../api";
import { blobDownload } from '@umbraco-cms/backoffice/utils';
import ConfigContextBase from "../../ConfigContextBase";

export class SiteContext extends ConfigContextBase {

    #isSitesLoaded: boolean = false;
    #isSiteDependenciesLoaded: boolean = false;

    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(SITE_CONTEXT_TOKEN, this);
    }

    #sites = new UmbArrayState<SiteApiModel>([], (x) => x.id);
    public readonly sites : Observable<SiteApiModel[]> = this.#initSites();

    #siteDependencies = new UmbObjectState<SiteDependenciesModel>({});
    public readonly siteDependencies : Observable<SiteDependenciesModel> = this.#initSiteDependencies();

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

    #initSiteDependencies() : Observable<SiteDependenciesModel> {
        if(!this.#isSiteDependenciesLoaded){
            this.#getSiteDependencies();
        }

        return this.#siteDependencies.asObservable();
    }

    async #getSiteDependencies() {
        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticSitesGetSiteDependencies());

        if(data){
            this.#siteDependencies.setValue(data);
            this.#isSiteDependenciesLoaded = true;
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
        await tryExecuteAndNotify(this, V1Service.deleteApiV1XstaticSitesDelete({ staticSiteId : id } ));
        await this.#getSites();
    }

    public async generateSite(id: number) : Promise<void> {
        await tryExecuteAndNotify(this, V1Service.postApiV1XstaticGenerateGenerateSite({ staticSiteId : id } ));
        await this.#getSites();
    }

    public async deploySite(id: number) : Promise<void> {
        await tryExecuteAndNotify(this, V1Service.postApiV1XstaticDeployDeploySite({ staticSiteId : id } ));
        await this.#getSites();
    }

    public async downloadSite(id: number): Promise<void> {
        const date = new Date();
        
        const dateString = `${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;

        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticDownloadDownloadSite({ staticSiteId: id }));
        blobDownload(data, `xStatic Site Download-${id}-${dateString}.zip`, 'application/zip');
    }
}

export default SiteContext;

export const SITE_CONTEXT_TOKEN = new UmbContextToken<SiteContext>("xStatic.SiteContext");