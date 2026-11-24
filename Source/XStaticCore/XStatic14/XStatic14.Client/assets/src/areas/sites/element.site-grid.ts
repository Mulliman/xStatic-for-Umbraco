import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { html, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import { SITE_CONTEXT_TOKEN } from "./context.site";

import "./element.site";
import "./element.new-site";
import "../../elements/element.dashboard-grid";
import { SiteApiModel } from "../../api";

@customElement("xstatic-site-grid")
class SiteGrid extends UmbLitElement {
  @state()
  isLoaded = false;

  @state()
  sites?: Array<SiteApiModel>;

  constructor() {
    super();

    this.consumeContext(SITE_CONTEXT_TOKEN, (context) => {
      this.observe(context?.sites, (sites) => {
        if (!sites) {
          return;
        }

        this.sites = sites;
        this.isLoaded = true;
      }, '_observeSites');
    });
  }

  render() {
    if (!this.isLoaded) {
      return html`<uui-loader-bar></uui-loader-bar>`;
    }

    return html`
      <xstatic-dashboard-grid>
        <xstatic-new-site-element slot="info"></xstatic-new-site-element>
        <div slot="grid">${this.#renderSites()}</div>
      </xstatic-dashboard-grid>
    `;
  }

  #renderSites() {
    return (this.sites ?? []).map((site) => html`<xstatic-site-element .site=${site}></xstatic-site-element>`);
  }
}

export default SiteGrid;

declare global {
  interface HTMLElementTagNameMap {
    "xstatic-site-grid": SiteGrid;
  }
}
