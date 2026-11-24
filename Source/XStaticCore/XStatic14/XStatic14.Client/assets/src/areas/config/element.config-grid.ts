import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css, html, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import { CONFIG_CONTEXT_TOKEN } from './context.config';

import { XStaticConfig } from '../../api';

import "./element.config-section";

interface ConfigSection {
    heading: string;
    icon: string;
    description: string;
    values: Array<string> | undefined;
}

@customElement('xstatic-config-grid')
class ConfigGrid extends UmbLitElement {

    @state()
    isLoaded = false;

    @state()
    config: XStaticConfig | undefined;

    constructor() {
        super();

        this.consumeContext(CONFIG_CONTEXT_TOKEN, (context) => {
            this.observe(context?.config, (c) => {
                this.config = c;
            }, '_observeConfig');

            this.isLoaded = true;
        });
    }

    #getSections(config: XStaticConfig): Array<ConfigSection> {
        const names = (items: Array<{ name?: string | null }> | null | undefined) => items?.map((x) => x.name ?? "");

        return [
            {
                heading: "Generators",
                icon: "icon-untitled",
                description: "Generators are the components that create the HTML/JSON version of the pages of the website pages.",
                values: names(config.generators),
            },
            {
                heading: "Transformer List Factories",
                icon: "icon-brackets",
                description: "A transformer changes the exported static data, for example changing URLs. These factories define which transformers are run and in which order.",
                values: names(config.transformerFactories),
            },
            {
                heading: "Deployers",
                icon: "icon-umb-deploy",
                description: "A deployer is the component that pushes the generated site to a remote service e.g. Netlify.",
                values: names(config.deployers),
            },
            {
                heading: "File Name Generators",
                icon: "icon-notepad-alt",
                description: "A file name generator is a component that creates the file names for each statically generated page.",
                values: names(config.fileNameGenerators),
            },
            {
                heading: "Post Generation Actions",
                icon: "icon-connection",
                description: "A Post Generation Action is a process that runs after all the pages have been generated.",
                values: names(config.postGenerationActions),
            },
        ];
    }

    render() {
        if (!this.config) {
            return this.isLoaded ? html`` : html`<uui-loader-bar></uui-loader-bar>`;
        }

        return this.#getSections(this.config)
            .filter((section) => section.values)
            .map((section) => html`
                <xstatic-config-section-element
                    .values=${section.values}
                    icon=${section.icon}
                    heading=${section.heading}
                    description=${section.description}>
                </xstatic-config-section-element>
            `);
    }

    static styles = css`
        :host {
            position: relative;
            display: grid;
            grid-gap: var(--uui-size-layout-1);
            grid-template-columns: repeat(auto-fill, minmax(min(400px, 100%), 1fr));
        }
    `;
}

export default ConfigGrid;

declare global {
    interface HTMLElementTagNameMap {
        'xstatic-config-grid': ConfigGrid
    }
}
