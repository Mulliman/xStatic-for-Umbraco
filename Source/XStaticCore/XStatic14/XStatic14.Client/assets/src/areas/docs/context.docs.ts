﻿import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { Observable, UmbArrayState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecuteAndNotify } from '@umbraco-cms/backoffice/resources'

import { DocModel } from './element.doc';

export class DocsContext extends UmbControllerBase {
    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(DOCS_CONTEXT_TOKEN, this);
    }

    #plugins = new UmbArrayState<DocModel>([], (d) => d.heading);
    public readonly plugins : Observable<DocModel[]> = this.#plugins.asObservable();

    #docs = new UmbArrayState<DocModel>([], (d) => d.heading);
    public readonly docs : Observable<DocModel[]> = this.#docs.asObservable();

    public async getDocs() {
        console.log('fetching docs');

        const { data } = await tryExecuteAndNotify(this, (await fetch('https://xstaticplugins.netlify.app/help.json')).json());

        if(data){
            console.log('data', data);

            const arr = data as Array<any>;

            var mapped = arr.map((d) => ({
                heading: d['title'],
                description : d['description'],
                links: [{href: d['link'], text: 'Read on external site'}]
            }) as DocModel);

            this.#docs.setValue(mapped);
        }
    }

    public async getPlugins() {
        console.log('fetching plugins');

        const { data } = await tryExecuteAndNotify(this, (await fetch('https://xstaticplugins.netlify.app/plugins.json')).json());

        if(data){
            console.log('data', data);

            const arr = data as Array<any>;

            var mapped = arr.map((d) => ({
                heading: d['id'],
                author: d['authors'],
                description : d['description'],
                links: this.getLinks(d)
            }) as DocModel);

            this.#plugins.setValue(mapped);
        }
    }

    getLinks(item: any){
        let arr : Array<{href: string, text: string}>= [];

        if(item['nugetLink']){
            arr.push({href: item['nugetLink'], text: 'NuGet'});
        }

        if(item['gitLink']){
            arr.push({href: item['gitLink'], text: 'Git Repo'});
        }

        return arr;
    }
}

export default DocsContext;

export const DOCS_CONTEXT_TOKEN = new UmbContextToken<DocsContext>(DocsContext.name);