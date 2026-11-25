import { customElement, html, state, type PropertyValues } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement, UmbModalToken } from "@umbraco-cms/backoffice/modal";
import { SafeActionModel, SafeDeploymentTargetModel, SiteApiModel, SiteUpdateModel, XStaticConfig } from "../../api";
import { UmbPropertyDatasetElement, UmbPropertyValueData } from "@umbraco-cms/backoffice/property";
import SiteContext, { SITE_CONTEXT_TOKEN } from "./context.site";
import { UmbLanguageCollectionRepository, UmbLanguageDetailModel } from "@umbraco-cms/backoffice/language";
import { renderFormDialog } from "../../elements/form-dialog";
import type { XStaticFormErrors, XStaticFormProperty } from "../../code/form";
import { buildSiteFormProperties, mapFormValuesToSiteUpdate, mapSiteToFormValues, validateSiteUpdate } from "./site-form";

import "../../elements/element.validation-error";

@customElement('xstatic-edit-site-modal')
export class EditSiteModalElement extends
    UmbModalBaseElement<EditSiteModalData, EditSiteModalValue>
{
    #languageRepository = new UmbLanguageCollectionRepository(this);
    #siteContext?: SiteContext;
    #valuesInitialized = false;

    @state()
    _values: Array<UmbPropertyValueData> = [];

    @state()
    config: XStaticConfig | undefined;

    @state()
    actions: SafeActionModel[] | undefined;

    @state()
    deploymentTargets: SafeDeploymentTargetModel[] | undefined;

    @state()
    private _cultures: Array<UmbLanguageDetailModel> = [];

    @state()
    errors: XStaticFormErrors = new Map();

    @state()
    showErrors: boolean = false;

    /** Rebuilt only when the options it depends on change, not on every render. */
    @state()
    private _properties: XStaticFormProperty[] = [];

    constructor() {
        super();

        this.consumeContext(
            SITE_CONTEXT_TOKEN,
            (context) => {
                this.#siteContext = context;

                this.observe(context?.siteDependencies, (x) => {
                    // SiteContext starts with an empty object until the request returns. The server always
                    // sends the lists (empty or null), so a missing key means the dependencies aren't loaded
                    // yet; keep the form hidden rather than show empty dropdowns.
                    if (!x || (x.actions === undefined && x.deployers === undefined && x.exportTypes === undefined)) {
                        return;
                    }

                    this.actions = x.actions ?? [];
                    this.deploymentTargets = x.deployers ?? [];

                    if (!this.isConnected) {
                        return;
                    }

                    if (this.modalContext && this.data?.content) {
                        this.updateValue({ content: this.data.content });
                    }

                    // Only seed the form once: later emissions (a refresh after a config change) must not
                    // wipe what the user has typed.
                    if (this.data?.content && !this.#valuesInitialized) {
                        this._values = mapSiteToFormValues(this.data.content);
                        this.#valuesInitialized = true;
                    }
                }, '_observeSiteDependencies');

                this.observe(context?.config, (x) => {
                    this.config = x;
                }, '_observeConfig');

                // Refresh data to ensure we have the latest config/export types
                context?.refreshData();
            }
        );
    }

    // #region init

    override connectedCallback() {
        super.connectedCallback();
        this.#getCultures();
    }

    async #getCultures() {
        const { data: languages } = await this.#languageRepository.requestCollection({ skip: 0, take: 100 });
        this._cultures = languages?.items ?? [];
    }

    protected override willUpdate(changed: PropertyValues): void {
        super.willUpdate(changed);

        if (changed.has('config') || changed.has('actions') || changed.has('deploymentTargets') || changed.has('_cultures')) {
            this._properties = buildSiteFormProperties({
                cultures: this._cultures,
                config: this.config,
                actions: this.actions,
                deploymentTargets: this.deploymentTargets,
            });
        }
    }

    // #endregion init

    //#region Render

    render() {
        if (!this.config || !this.actions || !this.deploymentTargets) {
            return html``;
        }

        return renderFormDialog({
            headline: this.data?.headline ?? 'Create new site',
            properties: this._properties,
            values: this._values,
            errors: this.showErrors ? this.errors : undefined,
            submitLabel: 'Submit',
            onChange: this.#onPropertyDataChange,
            onSubmit: this.#handleConfirm,
            onCancel: this.#handleCancel,
        });
    }

    // #endregion Render

    // #region Handlers

    #handleConfirm = async () => {
        const postModel = this.createPostModel();
        this.errors = validateSiteUpdate(postModel);

        if (this.errors.size > 0) {
            this.showErrors = true;
            return;
        }

        const data = postModel.id > 0
            ? await this.#siteContext?.updateSite(postModel)
            : await this.#siteContext?.createSite(postModel);

        if (data) {
            this.modalContext?.submit();
        }
    };

    #handleCancel = () => {
        this.modalContext?.reject();
    };

    #onPropertyDataChange = (e: Event) => {
        this._values = (e.target as UmbPropertyDatasetElement).value;
        this.errors = validateSiteUpdate(this.createPostModel());
    };

    // #endregion Handlers

    /** The model that Submit sends, built from the current form values. */
    createPostModel(): SiteUpdateModel {
        return mapFormValuesToSiteUpdate(this._values, this.data?.content?.id);
    }
}

export interface EditSiteModalData {
    headline?: string;
    content: SiteApiModel;
}

export interface EditSiteModalValue {
    content: SiteUpdateModel;
}

export const EditSiteModal = new UmbModalToken<EditSiteModalData, EditSiteModalValue>(
    "xstatic.editSiteModal",
    {
        modal: {
            type: 'sidebar',
            size: 'large',
        }
    }
);

export default EditSiteModalElement;
