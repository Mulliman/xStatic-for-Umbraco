import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, html, css, customElement, property } from "@umbraco-cms/backoffice/external/lit";

import "../areas/deployment-targets/element.deployment-grid";

@customElement('xstatic-deployment-target-dashboard')
export class XStaticDeploymentTargetsDashboard extends UmbElementMixin(LitElement) {

    constructor() {
        super();
    }

    @property()
    title = 'Deployment Targets'

    render() {
        return html`
            <umb-body-layout>
                <xstatic-deployment-target-grid></xstatic-deployment-target-grid>
            </umb-body-layout>
        `
    }

    static styles = css`
        :host {
            display: block;
            padding: 20px;
        }
    `
}


export default XStaticDeploymentTargetsDashboard;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-deployment-target-dashboard': XStaticDeploymentTargetsDashboard
    }
}