import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css, html, customElement, property, state, when } from '@umbraco-cms/backoffice/external/lit';
import type { xStaticTableItem } from "../../elements/element.site-table";
import { SiteApiModel } from '../../api';
import { UMB_MODAL_MANAGER_CONTEXT, umbConfirmModal } from '@umbraco-cms/backoffice/modal';
import { EditSiteModal } from './dialog.edit-site';

import "../../elements/element.site-table";
import "../../elements/element.loader";

import SiteContext, { SITE_CONTEXT_TOKEN } from './context.site';
import { formatDate, formatTime } from '../../code/datetime';
import { DETAILS_COLUMNS, toDetailItems } from '../../code/table-items';
import { xStaticCardStyles } from '../../code/styles';

export interface SiteRunningTask {
    task: string;
    startTime: Date;
    expectedDuration: number;
    currentSeconds: number;
}

@customElement('xstatic-site-element')
class SiteElement extends UmbLitElement {

    @property({ type: Object, attribute: false })
    site?: SiteApiModel;

    @state()
    runningTask: SiteRunningTask | null = null;

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

    //#region Render

    render() {
        if (!this.site) {
            return html``;
        }

        if (this.runningTask) {
            return this.#renderRunningTask(this.site, this.runningTask);
        }

        return this.#renderSiteDetails(this.site);
    }

    #renderRunningTask(site: SiteApiModel, runningTask: SiteRunningTask) {
        return html`
            <uui-box data-test-id="site-${site.id}">
                <div slot="headline" class="headline">${site.name}</div>

                <div class="task">
                    <h2>${runningTask.task}...</h2>

                    <xstatic-loader estimatedTime=${runningTask.expectedDuration}></xstatic-loader>
                </div>
            </uui-box>
        `;
    }

    #renderSiteDetails(site: SiteApiModel) {
        const hasStoredFiles = !!site.lastRun && site.folderSize !== '0B';

        return html`
            <uui-box data-test-id="site-${site.id}">
                <div slot="headline" class="headline">${site.name}</div>
                <div slot="header-actions">
                    <uui-button label="Edit" color="warning" look="primary" data-test-id="site-edit" @click=${this.#openEditDialog}><uui-icon name="icon-brush"></uui-icon></uui-button>
                    <uui-button label="Delete" color="danger" look="primary" data-test-id="site-delete" @click=${this.#delete}><uui-icon name="icon-trash"></uui-icon></uui-button>
                </div>

                <div class="card-body">
                    <xstatic-site-table iscompact .items=${this.getSiteTable()} .columns=${DETAILS_COLUMNS}></xstatic-site-table>
                    <div class="buttons">
                        <uui-button-group>
                            ${when(site.exportTypeName, () => html`
                                <uui-button label="Generate" color="positive" look="primary" data-test-id="site-generate" @click=${this.#generate}>
                                    <uui-icon name="icon-wand"></uui-icon>Generate
                                </uui-button>`)}
                            ${when(site.deploymentTarget, () => html`
                                <uui-button label="Deploy" color="danger" look="primary" data-test-id="site-deploy" @click=${this.#deploy}>
                                    <uui-icon name="icon-cloud-upload"></uui-icon>Deploy
                                </uui-button>`)}
                            ${when(hasStoredFiles, () => html`
                                <uui-button label="Clean" color="warning" look="primary" data-test-id="site-clean" @click=${this.#clean}>
                                    <uui-icon name="icon-delete"></uui-icon>Clean
                                </uui-button>`)}
                            ${when(hasStoredFiles, () => html`
                                <uui-button label="Download" color="default" look="secondary" data-test-id="site-download" @click=${this.#download}>
                                    <uui-icon name="icon-download-alt"></uui-icon>Download
                                </uui-button>`)}
                        </uui-button-group>
                    </div>
                </div>
            </uui-box>
        `;
    }

    getSiteTable() : Array<xStaticTableItem> {
        const site = this.site;

        if (!site) {
            return [];
        }

        const lastGen = site.lastRun
            ? `Last generated on ${formatDate(site.lastRun)} at ${formatTime(site.lastRun)}`
            : "This site has never been built.";

        const lastDeployed = site.lastDeployed
            ? `Last deployed on ${formatDate(site.lastDeployed)} at ${formatTime(site.lastDeployed)}`
            : "This site has never been deployed.";

        const autoDeployBadge = site.autoPublish
            ? html`<uui-tag color="positive" look="primary">Auto Publish On</uui-tag>`
            : html`Manual Deploy`;

        const targetLink = site.targetHostname
            ? html`<a href=${`https://${site.targetHostname}`} target="_blank" rel="noopener noreferrer">${site.targetHostname}</a>`
            : null;

        return toDetailItems([
            { id: "rootPath", icon: "icon-home", value: site.rootPath },
            { id: "cultures", icon: "icon-globe", value: site.cultures?.length ? "Cultures: " + site.cultures.join(" | ") : null },
            { id: "exportType", icon: "icon-brackets", value: site.exportTypeName ? "Exports as " + site.exportTypeName : null },
            { id: "autoDeploy", icon: "icon-settings", value: autoDeployBadge },
            { id: "lastGen", icon: "icon-time", value: lastGen },
            { id: "lastDeployed", icon: "icon-umb-deploy", value: lastDeployed },
            { id: "targetLocation", icon: "icon-link", value: targetLink },
            { id: "folder", icon: "icon-folder", value: (!site.folderSize || site.folderSize === '0B') ? null : "Size: " + site.folderSize },
        ]);
    }

    // #endregion Render

    // #region Handlers

    async #openEditDialog() {
        if (!this.site) return;

        const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
        modalManager?.open(this, EditSiteModal, { data: { content: this.site, headline: `Edit ${this.site.name} site` } });
    }

    async #delete() {
        const site = this.site;
        if (!site) return;

        try {
            await umbConfirmModal(this, {
                color: 'danger',
                headline: 'Delete Site',
                content: 'Are you sure you want to delete this Site?',
                confirmLabel: 'Delete',
            });
        } catch {
            return;
        }

        await this.#siteContext?.deleteSite(site.id);
    }

    async #clean() {
        const site = this.site;
        if (!site) return;

        try {
            await umbConfirmModal(this, {
                color: 'danger',
                headline: 'Clean Up Site',
                content: 'Are you sure you want to clean the generated files for this site? You will need to build again before you can deploy.',
                confirmLabel: 'Clean up',
            });
        } catch {
            return;
        }

        await this.#siteContext?.cleanSite(site.id);
    }

    async #generate() {
        const site = this.site;
        if (!site) return;

        await this.#runTask("Generating", site.lastBuildDurationInSeconds ?? 0, () => this.#siteContext?.generateSite(site.id));
    }

    async #deploy() {
        const site = this.site;
        if (!site) return;

        try {
            await umbConfirmModal(this, {
                color: 'positive',
                headline: 'Deploy Site',
                content: 'Are you sure you want to deploy this site?',
                confirmLabel: 'Deploy',
            });
        } catch {
            return;
        }

        await this.#runTask("Deploying", site.lastDeployDurationInSeconds ?? 0, () => this.#siteContext?.deploySite(site.id));
    }

    async #download() {
        const site = this.site;
        if (!site) return;

        await this.#runTask("Downloading", 10, () => this.#siteContext?.downloadSite(site.id));
    }

    async #runTask(task: string, expectedDuration: number, run: () => Promise<void> | undefined) {
        try {
            this.runningTask = { task, startTime: new Date(), expectedDuration, currentSeconds: 0 };

            await run();
        } finally {
            this.runningTask = null;
        }
    }

    // #endregion Handlers

    static styles = [
        xStaticCardStyles,
        css`
            .task {
                position: relative;
                display: block;
                text-align: center;
            }

            /* A uui-button-group never wraps, so on a narrow card the joined buttons spill out of the box.
               Below the width that fits all four, split the group into separate buttons that wrap. */
            .card-body {
                container-type: inline-size;
            }

            uui-button-group {
                max-width: 100%;
            }

            @container (max-width: 480px) {
                uui-button-group {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: var(--uui-size-space-2);
                }

                uui-button-group > uui-button {
                    --uui-button-border-radius: var(--uui-border-radius-3);
                }
            }
        `,
    ];
}

export default SiteElement;

declare global {
    interface HTMLElementTagNameMap {
        'xstatic-site-element': SiteElement
    }
}
