import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, property, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import { when } from 'lit/directives/when.js';
import type {
    xStaticTableColumn,
    xStaticTableConfig,
    xStaticTableItem,
  } from "../../elements/element.siteTable";
import { SiteApiModel } from '../../api';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditSiteModal } from './dialog.editSite';

import "../../elements/element.siteTable";

@customElement('xstatic-site-element')
class SiteElement extends UmbElementMixin(LitElement) {

    @property({ type: Object, attribute: false })
    site?: SiteApiModel;

    @state()
    private _tableConfig: xStaticTableConfig = {
    };

    @state()
    private _tableColumns: Array<xStaticTableColumn> = [ { alias: "value", name: "Details" } ];

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
    `;

    #openCreateDialog() {
        this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (manager) =>{
            manager.open(this, EditSiteModal, { data: { content: this.site!, headline: `Edit ${this.site?.name} site` } });
        } )
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

    getSiteTable() : Array<xStaticTableItem> {

        let lastGen = this.site?.lastRun 
            ?  `Last generated on ${this.site?.lastRun} at ${this.site.lastRun}`
            : "This site has never been built.";

        let lastDeployed = this.site?.lastDeployed 
            ?  `Last deployed on ${this.site?.lastDeployed} at ${this.site.lastDeployed}`
            : "This site has never been deployed.";

        let autoDeployBadge = this.site?.autoPublish
            ? html`<span style="color: green; font-weight: bold;">Auto Publish On</span>`
            : html`Manual Deploy`;

        let array : Array<xStaticTableItem> = [];

        this.addTableItem(array, "rootPath", "icon-home", "value", this.site?.rootPath);
        this.addTableItem(array, "exportType", "icon-brackets", "value", !this.site?.exportTypeName ? null : "Exports as " + this.site?.exportTypeName);
        this.addTableItem(array, "autoDeploy", "icon-settings", "value", autoDeployBadge);
        this.addTableItem(array, "lastGen", "icon-time", "value", lastGen);
        this.addTableItem(array, "lastDeployed", "icon-umb-deploy", "value", lastDeployed);
        this.addTableItem(array, "folder", "icon-folder", "value", (!this.site?.folderSize || this.site?.folderSize === '0B') ? null : "Size: " + this.site?.folderSize);

        return array;
    }

    render() {
        console.log('rendering site', this.site);

        if (!this.site) {
            return html``;
        }

        const site = this.site;

        return html`
            <uui-box>
                <div slot="headline" pristine="" style="font-size: 1.2rem; padding-top: 0.5rem;">${site.name}</div>
                <div slot="header-actions" >
                    <uui-button pristine="" label="Edit" color="warning" look="primary" @click=${() => this.#openCreateDialog()}><uui-icon name="icon-brush"></uui-icon></uui-button>
                    <uui-button pristine="" label="Delete" color="danger" look="primary"><uui-icon name="icon-trash"></uui-icon></uui-button>
                </div>
                
                <div style="position:relative; display: block">
                    <div>
                        
                    </div>
                    <div>
                        <xstatic-site-table .items=${this.getSiteTable()} .config=${this._tableConfig} .columns=${this._tableColumns} ></xstatic-site-table>
                    </div>
                    <div class="buttons">
                        <uui-button-group>
                            ${when(this.site.exportTypeName, () => html`<uui-button label="Generate" color="positive" look="primary" icon="icon-brush"></uui-button>`)}
                            ${when(this.site.deploymentTarget, () => html`<uui-button label="Deploy" color="danger" look="primary" icon="icon-upload">Deploy</uui-button>`)}
                            ${when(this.site.lastRun && this.site.folderSize != '0B', () => html`<uui-button label="Download" color="default" look="secondary" icon="icon-settings"></uui-button>`)}
                        </uui-button-group>
                    </div>
                </div>
            </uui-box>
        `;
    }
}

export default SiteElement;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-site-element': SiteElement
    }
}