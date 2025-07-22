import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { Observable, UmbArrayState, UmbBooleanState, UmbObjectState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecute } from '@umbraco-cms/backoffice/resources'
import { SiteApiModel, SiteDependenciesModel, SiteUpdateModel, V1Service } from "../../api";
import { blobDownload } from '@umbraco-cms/backoffice/utils';
import ConfigContextBase from "../../config-context-base";

export class SiteContext extends ConfigContextBase {

    #isSitesLoaded = new UmbBooleanState(false);
    public readonly isSitesLoaded : Observable<boolean> = this.#isSitesLoaded.asObservable();

    #isSiteDependenciesLoaded: boolean = false;

    constructor(host: UmbControllerHost) {
        super(host);

        console.log("Constructing sites context...");

        this.provideContext(SITE_CONTEXT_TOKEN, this);

        console.log("Listening for xStaticEvent...");

		window.addEventListener("xStaticEvent", () => { 
            console.log("xStaticEvent received in SiteContext, refreshing sites and dependencies...");

            this.#isSitesLoaded.setValue(false); 
            this.#isSiteDependenciesLoaded = false; 

            this.#initSites();
            this.#initSiteDependencies();
            this.refreshData();
        });
    }

    override destroy(): void {
		window.removeEventListener("xStaticEvent", () => {});
        
        super.destroy();
	}

    #sites = new UmbArrayState<SiteApiModel>([], (x) => x.id);
    public get sites() : Observable<SiteApiModel[]> { return this.#initSites(); }

    #siteDependencies = new UmbObjectState<SiteDependenciesModel>({});
    public get siteDependencies() : Observable<SiteDependenciesModel> { return this.#initSiteDependencies(); }

    // public hostConnected(): void {
    //     console.log("Listening for xStaticEvent...");

	// 	window.addEventListener("xStaticEvent", () => { 
    //         console.log("xStaticEvent received in SiteContext, refreshing sites and dependencies...");

    //         this.#isSitesLoaded.setValue(false); 
    //         this.#isSiteDependenciesLoaded = false; 

    //         this.#initSites();
    //         this.#initSiteDependencies();
    //         this.refreshData();
    //     });
	// }

	// public hostDisconnected(): void {
	// 	window.removeEventListener("xStaticEvent", () => {});
	// }

    #initSites() : Observable<SiteApiModel[]> {
        console.log("Initializing sites...");

        if(!this.#isSitesLoaded.getValue()){
            console.log("Fetching sites from API...");
            this.#getSites();
        }

        return this.#sites.asObservable();
    }

    async #getSites() {
        const data = await tryExecute(this, V1Service.getApiV1XstaticSitesGetAll());

        console.log("Sites data received:", data);

        if(data){
            this.#sites.setValue(data);
            this.#isSitesLoaded.setValue(true);
        }
    }

    #initSiteDependencies() : Observable<SiteDependenciesModel> {
        if(!this.#isSiteDependenciesLoaded){
            this.#getSiteDependencies();
        }

        return this.#siteDependencies.asObservable();
    }

    async #getSiteDependencies() {
        const data = await tryExecute(this, V1Service.getApiV1XstaticSitesGetSiteDependencies());

        if(data){
            this.#siteDependencies.setValue(data);
            this.#isSiteDependenciesLoaded = true;
        }
    }

    public async createSite(site: SiteUpdateModel) : Promise<SiteApiModel | null> {
        const data = await tryExecute(this, V1Service.postApiV1XstaticSitesCreate({ requestBody: site }));

        if(data){
            await this.#getSites();

            return data;
        }

        return null;
    }

    public async updateSite(site: SiteUpdateModel) : Promise<SiteApiModel | null> {
        const data = await tryExecute(this, V1Service.postApiV1XstaticSitesUpdate({ requestBody: site }));

        if(data){
            await this.#getSites();

            return data;
        }

        return null;
    }

    public async deleteSite(id: number) : Promise<void> {
        await tryExecute(this, V1Service.deleteApiV1XstaticSitesDelete({ staticSiteId : id } ));
        await this.#getSites();
    }

    public async generateSite(id: number) : Promise<void> {
        await tryExecute(this, V1Service.postApiV1XstaticGenerateGenerateSite({ staticSiteId : id } ));
        await this.#getSites();
    }

    public async deploySite(id: number) : Promise<void> {
        await tryExecute(this, V1Service.postApiV1XstaticDeployDeploySite({ staticSiteId : id } ));
        await this.#getSites();
    }

    public async cleanSite(id: number) : Promise<void> {
        await tryExecute(this, V1Service.deleteApiV1XstaticSitesClearStoredSite({ staticSiteId : id } ));
        await this.#getSites();
    }

    public async downloadSite(id: number): Promise<void> {
        const date = new Date();
        
        const dateString = `${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;

        const data = await tryExecute(this, V1Service.getApiV1XstaticDownloadDownloadSite({ staticSiteId: id }));
        blobDownload(data, `xStatic Site Download-${id}-${dateString}.zip`, 'application/zip');
    }
}

export default SiteContext;

export const SITE_CONTEXT_TOKEN = new UmbContextToken<SiteContext>("xStatic.SiteContext");