import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, property, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import { when } from 'lit/directives/when.js';
import type {
    xStaticTableItem,
  } from "../../elements/element.siteTable";
import { SiteApiModel } from '../../api';
import { UMB_MODAL_MANAGER_CONTEXT, umbConfirmModal } from '@umbraco-cms/backoffice/modal';
import { EditSiteModal } from './dialog.editSite';

import "../../elements/element.siteTable";
import "../../elements/element.loader";

import SiteContext, { SITE_CONTEXT_TOKEN } from './context.site';
import { formatDate, formatTime } from '../../code/datetime';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

@customElement('xstatic-site-element')
class SiteElement extends UmbElementMixin(LitElement) {

    @property({ type: Object, attribute: false })
    site?: SiteApiModel;

    @state()
    runningTask: {task: string, startTime: Date, expectedDuration: number, currentSeconds: number} | null = null;

    #siteContext?: SiteContext;

    constructor() {
        super();

        this.consumeContext(
            SITE_CONTEXT_TOKEN,
            (context) => {
                this.#siteContext = context;
            }
        );
    }

    
    // #region init



    // #endregion init

    //#region Render

    render() {
        if (!this.site) {
            return html``;
        }

        const site = this.site;

        if(this.runningTask) { //this.runningTask?.value) {
            return this.#renderRunningTask(site, this.runningTask);
        }

        return this.#renderSiteDetails(site);
    }

    #renderRunningTask(site: SiteApiModel, runningTask: {task: string, startTime: Date, expectedDuration: number, currentSeconds: number}) {

        return html`
            <uui-box>
                <div slot="headline" pristine="" style="font-size: 1.2rem; padding-top: 0.5rem;">${site.name}</div>
                
                <div class="task">
                    <h2>${runningTask.task}...</h2>

                    <xstatic-loader estimatedTime=${runningTask.expectedDuration}></xstatic-loader>
                </div>
            </uui-box>
        `;
    }

    #renderSiteDetails(site: SiteApiModel) {
        

        return html`
            <uui-box>
                <div slot="headline" pristine="" style="font-size: 1.2rem; padding-top: 0.5rem;">${site.name}</div>
                <div slot="header-actions" >
                    <uui-button pristine="" label="Edit" color="warning" look="primary" @click=${() => this.#openCreateDialog()}><uui-icon name="icon-brush"></uui-icon></uui-button>
                    <uui-button pristine="" label="Delete" color="danger" look="primary"  @click=${() => this.#delete()}><uui-icon name="icon-trash"></uui-icon></uui-button>
                </div>
                
                <div style="position:relative; display: block">
                    <div>
                        <xstatic-site-table .items=${this.getSiteTable()} .config=${{}} .columns=${[ { alias: "value", name: "Details" } ]} ></xstatic-site-table>
                    </div>
                    <div class="buttons">
                        <uui-button-group>
                            ${when(site.exportTypeName, () => html`<uui-button label="Generate" @click=${() => this.#generate()} color="positive" look="primary" icon="icon-brush"></uui-button>`)}
                            ${when(site.deploymentTarget, () => html`<uui-button label="Deploy" @click=${() => this.#deploy()} color="danger" look="primary" icon="icon-upload">Deploy</uui-button>`)}
                            ${when(site.lastRun && site.folderSize != '0B', () => html`<uui-button label="Download" @click=${() => this.#download()} color="default" look="secondary" icon="icon-settings"></uui-button>`)}
                        </uui-button-group>
                    </div>
                </div>
            </uui-box>
        `;
    }

    getSiteTable() : Array<xStaticTableItem> {

        let lastGen = this.site?.lastRun 
            ?  `Last generated on ${formatDate(this.site?.lastRun)} at ${formatTime(this.site.lastRun)}`
            : "This site has never been built.";

        let lastDeployed = this.site?.lastDeployed 
            ?  `Last deployed on ${formatDate(this.site?.lastDeployed)} at ${formatTime(this.site.lastDeployed)}`
            : "This site has never been deployed.";

        let autoDeployBadge = this.site?.autoPublish
            ? html`<span style="color: green; font-weight: bold;">Auto Publish On</span>`
            : html`Manual Deploy`;

        let array : Array<xStaticTableItem> = [];

        this.addTableItem(array, "rootPath", "icon-home", "value", this.site?.rootPath);
        this.addTableItem(array, "cultures", "icon-globe", "value", !this.site?.cultures?.length ?? 0 > 0 ? null : "Cultures: " + this.site?.cultures?.join(" | "));
        this.addTableItem(array, "exportType", "icon-brackets", "value", !this.site?.exportTypeName ? null : "Exports as " + this.site?.exportTypeName);
        this.addTableItem(array, "autoDeploy", "icon-settings", "value", autoDeployBadge);
        this.addTableItem(array, "lastGen", "icon-time", "value", lastGen);
        this.addTableItem(array, "lastDeployed", "icon-umb-deploy", "value", lastDeployed);
        this.addTableItem(array, "targetLocation", "icon-link", "value", this.site?.targetHostname ? unsafeHTML(`<a href="https://${this.site.targetHostname}" target="_blank" />${this.site.targetHostname}</a>`) : null );
        this.addTableItem(array, "folder", "icon-folder", "value", (!this.site?.folderSize || this.site?.folderSize === '0B') ? null : "Size: " + this.site?.folderSize);

        return array;
    }

    addTableItem(array: Array<xStaticTableItem>, id: string, icon: string, alias: string, value: any) {
        if(!id || !alias || !value) {
            return;
        }

        const item = {
            id: id,
            icon: icon,
            data: [
            {
                columnAlias: alias,
                value: value
            }]
        };

        array.push(item);
    }

    // #endregion Render

    // #region Handlers

    #openCreateDialog() {
        this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (manager) =>{
            manager.open(this, EditSiteModal, { data: { content: this.site!, headline: `Edit ${this.site?.name} site` } });
        } )
    }

    async #delete() {
        await umbConfirmModal(this, {
            color: 'danger',
            headline: 'Delete Site',
            content: 'Are you sure you want to delete this Site?',
            confirmLabel: 'Delete',
        });

        await this.#siteContext!.deleteSite(this.site!.id);
    }

    async #generate() {
        try {
            let currentSeconds = 0;
            this.runningTask = { task: "Generating", startTime: new Date(), expectedDuration: this.site!.lastBuildDurationInSeconds ?? 0, currentSeconds };

            await new Promise(resolve => setTimeout(resolve, 1000));

            await this.#siteContext!.generateSite(this.site!.id);
        } finally {
            this.runningTask = null;
        }
    }

    async #deploy() {
        await umbConfirmModal(this, {
            color: 'positive',
            headline: 'Deploy Site',
            content: 'Are you sure you want to deploy this site?',
            confirmLabel: 'Deploy',
        });

        try {
            let currentSeconds = 0;
            this.runningTask = { task: "Deploying", startTime: new Date(), expectedDuration: this.site!.lastDeployDurationInSeconds ?? 0, currentSeconds };

            await new Promise(resolve => setTimeout(resolve, 1000));

            await this.#siteContext!.deploySite(this.site!.id);
        } finally {
            this.runningTask = null;
        }
    }

    async #download() {
        try {
            let currentSeconds = 0;
            this.runningTask = { task: "Downloading", startTime: new Date(), expectedDuration: 10, currentSeconds };

            await new Promise(resolve => setTimeout(resolve, 1000));

            await this.#siteContext!.downloadSite(this.site!.id);
        } finally {
            this.runningTask = null;
        }
    }

    // #endregion Handlers

    // #region Form

    

    // #endregion Form

    // #region Mappers

    

    // #endregion Mappers

    // #region Utils



    // #endregion Utils

    // #region Styles

    static styles = css`
        :host {
            display: block;
            position: relative;
            width: 100%;
        }

        :host .badge{
            display: block;
            position: relative;
            text-align: center;
            width: 100%;
        }

        .buttons {
            text-align: center;
            margin-top: 20px;
        }

        .task{
            position:relative;
            display: block;
            text-align: center;
        }
    `;

    // #endregion Styles
    
}

export default SiteElement;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-site-element': SiteElement
    }
}