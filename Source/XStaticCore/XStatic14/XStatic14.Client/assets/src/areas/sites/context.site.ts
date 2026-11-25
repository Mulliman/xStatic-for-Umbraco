import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { Observable, UmbArrayState, UmbBooleanState, UmbObjectState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecute } from '@umbraco-cms/backoffice/resources'
import { UMB_NOTIFICATION_CONTEXT } from '@umbraco-cms/backoffice/notification';
import { RebuildProcessResult, SiteApiModel, SiteDependenciesModel, SiteUpdateModel, V1Service } from "../../api";
import { blobDownload } from '@umbraco-cms/backoffice/utils';
import ConfigContextBase from "../../config-context-base";
import { configChanges, getConfigVersion } from "../../code/config-changes";

export class SiteContext extends ConfigContextBase {

    #isSitesLoaded = new UmbBooleanState(false);
    public readonly isSitesLoaded : Observable<boolean> = this.#isSitesLoaded.asObservable();

    #isSiteDependenciesLoaded: boolean = false;

    #seenConfigVersion = getConfigVersion();

    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(SITE_CONTEXT_TOKEN, this);

        // Export types, deployment targets and actions feed the site dialog, so reload when any of them change.
        // The observer is removed when this context is destroyed.
        this.observe(configChanges, (version) => {
            if (version === this.#seenConfigVersion) {
                return;
            }

            this.#seenConfigVersion = version;
            this.#onConfigChanged();
        }, '_observeConfigChanges');
    }

    #onConfigChanged() {
        this.#isSitesLoaded.setValue(false);
        this.#isSiteDependenciesLoaded = false;

        this.#initSites();
        this.#initSiteDependencies();
        this.refreshData();
    }

    #sites = new UmbArrayState<SiteApiModel>([], (x) => x.id);
    public get sites() : Observable<SiteApiModel[]> { return this.#initSites(); }

    #siteDependencies = new UmbObjectState<SiteDependenciesModel>({});
    public get siteDependencies() : Observable<SiteDependenciesModel> { return this.#initSiteDependencies(); }

    #initSites() : Observable<SiteApiModel[]> {

        if(!this.#isSitesLoaded.getValue()){
            this.#getSites();
        }

        return this.#sites.asObservable();
    }

    async #getSites() {
        const data = await tryExecute(this, V1Service.getApiV1XstaticSitesGetAll());

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
        const result = await tryExecute(this, V1Service.postApiV1XstaticGenerateGenerateSite({ staticSiteId : id } ));
        await this.#notifyGenerateResult(result);
        await this.#getSites();
    }

    async #notifyGenerateResult(result: RebuildProcessResult | undefined) {
        // HTTP errors are already surfaced by tryExecute; here we handle a 200 with wasSuccessful: false.
        if (!result || result.wasSuccessful) {
            return;
        }

        const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);

        if (!notificationContext) {
            return;
        }

        if (result.exception) {
            notificationContext.peek('danger', {
                data: { headline: 'Generation failed', message: result.exception }
            });

            return;
        }

        const failures = (result.results ?? []).filter(r => !r.wasSuccessful);

        if (!failures.length) {
            return;
        }

        const maxShown = 5;
        const summary = failures
            .slice(0, maxShown)
            .map(f => f.message ? `${f.item}: ${f.message}` : `${f.item}`)
            .join('\n');
        const more = failures.length > maxShown ? `\n…and ${failures.length - maxShown} more` : '';

        notificationContext.peek('warning', {
            data: {
                headline: `Site generated with ${failures.length} problem${failures.length === 1 ? '' : 's'}`,
                message: summary + more
            }
        });
    }

    public async deploySite(id: number) : Promise<void> {
        const result = await tryExecute(this, V1Service.postApiV1XstaticDeployDeploySite({ staticSiteId : id } ));
        await this.#notifyDeployResult(result);
        await this.#getSites();
    }

    async #notifyDeployResult(result: { wasSuccessful?: boolean; message?: string | null } | undefined) {
        // HTTP errors are already surfaced by tryExecute; here we handle a 200 with wasSuccessful: false.
        // A successful deploy shows no notification, the same as a successful generate.
        if (!result || result.wasSuccessful !== false) {
            return;
        }

        const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);

        notificationContext?.peek('danger', {
            data: {
                headline: 'Deployment failed',
                message: result.message?.trim() || 'The site could not be deployed. Check the Umbraco logs for details.'
            }
        });
    }

    public async cleanSite(id: number) : Promise<void> {
        await tryExecute(this, V1Service.deleteApiV1XstaticSitesClearStoredSite({ staticSiteId : id } ));
        await this.#getSites();
    }

    public async downloadSite(id: number): Promise<void> {
        const date = new Date();

        const dateString = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;

        const data = await tryExecute(this, V1Service.getApiV1XstaticDownloadDownloadSite({ staticSiteId: id }));
        if (data) {
            blobDownload(data, `xStatic Site Download-${id}-${dateString}.zip`, 'application/zip');
        }
    }
}

export default SiteContext;

export const SITE_CONTEXT_TOKEN = new UmbContextToken<SiteContext>("xStatic.SiteContext");
