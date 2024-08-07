import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import SiteContext, { SITE_CONTEXT_TOKEN } from './context.site';

import "./element.site";
import "./element.newSite";
import { SiteApiModel } from '../../api';

@customElement('xstatic-site-grid')
class SiteGrid extends UmbElementMixin(LitElement) {

    @state()
    isLoaded = false;

    @state()
    sites?: Array<SiteApiModel>;

    #siteContext?: SiteContext;

    constructor() {
        super();

        this.consumeContext(
            SITE_CONTEXT_TOKEN,
            (context) => {
              this.#siteContext = context;

              this.observe(this.#siteContext?.sites, (sites) => {
                this.sites = sites;

                this.isLoaded = true;
            });
        });
    }

    render() {
        if(!this.sites) {
            return this.isLoaded ? html`` : html`Loading...`;
        }

        return html`
            <xstatic-new-site-element></xstatic-new-site-element>
            ${this.#renderSites()}
        `;
    }

    #renderSites() {
        if(!this.sites) {
            return null;
        }

        return this.sites.map(site => {
            return html`
                <xstatic-site-element .site=${site}></xstatic-site-element>
            `
        });
    }

    static styles = css`
        :host {
            position: relative;
            display: grid;
            grid-gap: 20px;
            grid-template-columns: repeat(auto-fill,minmax(400px,1fr));
            grid-auto-rows: 1fr
        }

        :host > div{
            display: block;
            position: relative;
        }
    `;
}

export default SiteGrid;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-site-grid': SiteGrid
    }
}