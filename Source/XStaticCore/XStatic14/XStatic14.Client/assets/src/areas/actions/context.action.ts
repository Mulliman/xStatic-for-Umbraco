import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { Observable, UmbArrayState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecute } from '@umbraco-cms/backoffice/resources'
import { ActionModel, ActionUpdateModel, V1Service } from "../../api";
import { umbConfirmModal } from "@umbraco-cms/backoffice/modal";
import ConfigContextBase from "../../config-context-base";
import { xStaticEvent } from "../../xstatic-event";

export class ActionContext extends ConfigContextBase {
    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(ACTION_CONTEXT_TOKEN, this);
    }

    isActionsLoaded: boolean = false;

    #actions = new UmbArrayState<ActionModel>([], (x) => x.id);
    public get actions() : Observable<ActionModel[]> { return this.#initActions(); }

    public async createAction(action: ActionUpdateModel) : Promise<ActionModel | null> {
        const data = await tryExecute(this, V1Service.postApiV1XstaticActionsCreatePostAction({ requestBody: action }));

        window.dispatchEvent(new xStaticEvent());

        if(data){
            await this.#getActions();

            return data;
        }

        return null;
    }

    public async updateAction(action: ActionUpdateModel) : Promise<ActionModel | null> {
        const data = await tryExecute(this, V1Service.postApiV1XstaticActionsUpdatePostAction({ requestBody: action }));

        window.dispatchEvent(new xStaticEvent());

        if(data){
            await this.#getActions();

            return data;
        }

        return null;
    }

    public async deleteAction(id: number) : Promise<void> {
        await umbConfirmModal(this, {
            color: 'danger',
            headline: 'Delete Action',
            content: 'Are you sure you want to delete this Action?',
            confirmLabel: 'Delete',
        });

        await tryExecute(this, V1Service.deleteApiV1XstaticActionsDeletePostAction({ id : id } ));
        await this.#getActions();

        window.dispatchEvent(new xStaticEvent());
    }

    #initActions() : Observable<ActionModel[]> {
        if(!this.isActionsLoaded){
            this.#getActions();
        }

        return this.#actions.asObservable();
    }

    async #getActions() {
        const data = await tryExecute(this, V1Service.getApiV1XstaticActionsGetPostActions());

        if(data){
            this.#actions.setValue(data);

            this.isActionsLoaded = true;
        }
    }
}

export default ActionContext;

export const ACTION_CONTEXT_TOKEN = new UmbContextToken<ActionContext>("xStatic.ActionContext");