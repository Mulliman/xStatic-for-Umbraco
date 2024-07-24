import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { tryExecuteAndNotify } from '@umbraco-cms/backoffice/resources'
import { Site, exampleSite, exampleSite2 } from '../models/site';
import { customElement, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import { V1Service } from '../api/services';

import "./siteElement.element";
import "./newSiteElement.element";
import { SiteApiModel } from '../api';

@customElement('xstatic-site-grid')
class SiteGrid extends UmbElementMixin(LitElement) {

    @state()
    isLoaded = false;

    @state()
    sites?: Array<SiteApiModel>;

    static styles = css`
        :host {
            position: relative;
            display: grid;
            grid-gap: 20px;
            grid-template-columns: repeat(auto-fill,minmax(450px,1fr));
        }

        :host > div{
            display: block;
            position: relative;
        }
    `;

    async connectedCallback() {
        super.connectedCallback();
        
        console.log('fetching sites proper');

        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticGetAll());

        if(data){
            this.sites = data;
            this.isLoaded = true;
        }
        

        // this.sites = [exampleSite, exampleSite2];
    }

    #renderSites() {
        console.log('rendering sites loop', this.sites);

        if(!this.sites) {
            return null;
        }

        return this.sites.map(site => {
            return html`
                <xstatic-site-element .site=${site}></xstatic-site-element>
            `
        });
    }

    render() {
        console.log('rendering sites', this.sites);

        if(!this.sites) {
            return this.isLoaded ? html`` : html`Loading...`;
        }

        return html`
            <xstatic-new-site-element></xstatic-new-site-element>
            ${this.#renderSites()}
        `;
    }
}

export default SiteGrid;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-site-grid': SiteGrid
    }
}