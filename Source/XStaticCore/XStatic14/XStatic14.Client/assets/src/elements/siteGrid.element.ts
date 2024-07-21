import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { Site, exampleSite, exampleSite2 } from '../models/site';
import { customElement, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';

import "./siteElement.element";

@customElement('xstatic-site-grid')
class SiteGrid extends UmbElementMixin(LitElement) {

    @state()
    isLoaded = false;

    @state()
    sites?: Array<Site>;

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
        
        console.log('fetching sites');
        this.sites = [exampleSite, exampleSite2];
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