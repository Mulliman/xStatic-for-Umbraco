﻿import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { Observable, UmbArrayState, UmbObjectState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecuteAndNotify } from '@umbraco-cms/backoffice/resources'
import { ActionModel, ActionUpdateModel, V1Service, XStaticConfig } from "../../api";
import { umbConfirmModal } from "@umbraco-cms/backoffice/modal";

export class ActionContext extends UmbControllerBase {
    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(ACTION_CONTEXT_TOKEN, this);
    }

    isConfigLoaded: boolean = false;
    isActionsLoaded: boolean = false;

    #config = new UmbObjectState<XStaticConfig>({} as XStaticConfig);
    public readonly config : Observable<XStaticConfig> = this.#initConfig();

    #actions = new UmbArrayState<ActionModel>([], (x) => x.id);
    public readonly actions : Observable<ActionModel[]> = this.#initActions();


    public async createAction(action: ActionUpdateModel) : Promise<ActionModel | null> {
        console.log('creating action', action);

        const { data } = await tryExecuteAndNotify(this, V1Service.postApiV1XstaticActionsCreatePostAction({ requestBody: action }));

        if(data){
            await this.#getActions();

            return data;
        }

        return null;
    }

    public async updateAction(action: ActionUpdateModel) : Promise<ActionModel | null> {
        console.log('updating action', action);

        const { data } = await tryExecuteAndNotify(this, V1Service.postApiV1XstaticActionsUpdatePostAction({ requestBody: action }));

        if(data){
            await this.#getActions();

            return data;
        }

        return null;
    }

    public async deleteAction(id: number) : Promise<void> {
        console.log('deleting action', id);

        await umbConfirmModal(this, {
            color: 'danger',
            headline: 'Delete Action',
            content: 'Are you sure you want to delete this Action?',
            confirmLabel: 'Delete',
        });

        await tryExecuteAndNotify(this, V1Service.deleteApiV1XstaticActionsDeletePostAction({ id : id } ));
        await this.#getActions();
    }

    #initConfig() : Observable<XStaticConfig> {
        console.log('init config');

        if(!this.isConfigLoaded){
            this.#getConfig();
        }

        return this.#config.asObservable();
    }

    #initActions() : Observable<ActionModel[]> {
        console.log('init actions');

        if(!this.isActionsLoaded){
            this.#getActions();
        }

        return this.#actions.asObservable();
    }

    async #getConfig() {
        
        console.log('fetching config');

        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticConfigGetConfig());

        if(data){
            console.log('data', data);

            this.#config.setValue(data);

            this.isConfigLoaded = true;
        }
    }

    async #getActions() {
        console.log('fetching actions');

        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticActionsGetPostActions());

        if(data){
            this.#actions.setValue(data);

            this.isActionsLoaded = true;
        }
    }
}

export default ActionContext;

export const ACTION_CONTEXT_TOKEN = new UmbContextToken<ActionContext>(ActionContext.name);