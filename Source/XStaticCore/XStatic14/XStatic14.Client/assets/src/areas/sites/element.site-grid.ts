import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import SiteContext, { SITE_CONTEXT_TOKEN } from './context.site';

import "./element.site";
import "./element.new-site";
import "../../elements/element.dashboard-grid";
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

              this.observe(this.#siteContext.sites, (sites) => {
                this.sites = sites;

                this.isLoaded = true;
            });
        });
    }

    render() {
        if(!this.isLoaded ) {
            return html`Loading...`;
        }

        return html`
            <xstatic-dashboard-grid>
                <xstatic-new-site-element slot="info"></xstatic-new-site-element>
                <div slot="grid">${this.#renderSites()}</div>
            </xstatic-dashboard-grid>
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
}

export default SiteGrid;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-site-grid': SiteGrid
    }
}