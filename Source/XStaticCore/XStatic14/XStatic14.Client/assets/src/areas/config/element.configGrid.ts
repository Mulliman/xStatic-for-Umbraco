import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import ConfigContext, { CONFIG_CONTEXT_TOKEN } from './context.config';

import { XStaticConfig } from '../../api';

import "./element.configSection";

@customElement('xstatic-config-grid')
class ConfigGrid extends UmbElementMixin(LitElement) {

    @state()
    isLoaded = false;

    @state()
    config: XStaticConfig | undefined;

    #configContext?: ConfigContext;

    constructor() {
        super();

        this.consumeContext(
            CONFIG_CONTEXT_TOKEN,
            (context) => {
                this.#configContext = context;

                this.observe(this.#configContext?.config, (c) => {
                    this.config = c;
                });

                this.isLoaded = true;
            }
        );
    }

    render() {
        if (!this.config) {
            return this.isLoaded ? html`` : html`Loading...`;
        }

        return html`
            ${this.#renderGenerators()}
            ${this.#renderTransformerFactories()}
            ${this.#renderDeployers()}
            ${this.#renderFileNameGenerators()}
            ${this.#renderPostGenActions()}
        `;
    }

    #renderGenerators() {
        if (!this.config?.generators) {
            return null;
        }

        var generators = this.config?.generators.map(g => g.name ?? "");

        return html`
            <xstatic-config-section-element .values=${generators}
             icon="icon-untitled"
             heading="Generators"
             description="Generators are the components that create the HTML/JSON version of the pages of the website pages." >
            </xstatic-config-section-element>
        `;
    }

    #renderTransformerFactories() {
        if (!this.config?.transformerFactories) {
            return null;
        }

        var transformerFactories = this.config?.transformerFactories.map(t => t.name ?? "");

        return html`
            <xstatic-config-section-element .values=${transformerFactories} 
            icon="icon-brackets"
            heading="Transformer List Factories" 
            description="A transformer changes the exported static data, for example changing URLs. These factories define which transformers are run and in which order." ></xstatic-config-section-element>
        `;
    }

    #renderDeployers() {
        if (!this.config?.deployers) {
            return null;
        }

        var deployers = this.config?.deployers.map(deployer => deployer.name ?? "");

        return html`
            <xstatic-config-section-element .values=${deployers} 
            icon="icon-umb-deploy"
            heading="Deployers" 
            description="A deployer is the component that pushes the generated site to a remote service e.g. Netlify." ></xstatic-config-section-element>
        `;
    }

    #renderFileNameGenerators() {
        if (!this.config?.fileNameGenerators) {
            return null;
        }

        var generators = this.config?.fileNameGenerators.map(f => f.name ?? "");

        return html`
            <xstatic-config-section-element .values=${generators} 
            icon="icon-notepad-alt"
            heading="File Name Generators" 
            description="A file name generator is a component that creates the file names for each statically generated page."></xstatic-config-section-element>
        `;
    }

    #renderPostGenActions() {
        if (!this.config?.postGenerationActions) {
            return null;
        }

        var actions = this.config?.postGenerationActions.map(a => a.name ?? "");

        return html`
            <xstatic-config-section-element .values=${actions} 
            icon="icon-connection"
            heading="Post Generation Actions" 
            description="A Post Generation Action is a process that runs after all the pages have been generated."></xstatic-config-section-element>
        `;
    }

    static styles = css`
        :host {
            position: relative;
            display: grid;
            grid-gap: 20px;
            grid-template-columns: repeat(auto-fill,minmax(400px,1fr));
        }

        :host > div{
            display: block;
            position: relative;
        }
    `;
}

export default ConfigGrid;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-config-grid': ConfigGrid
    }
}