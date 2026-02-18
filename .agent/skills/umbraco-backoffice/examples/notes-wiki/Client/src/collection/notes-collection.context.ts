/**
 * Notes Collection Context
 *
 * Manages the state of the notes collection (items, filter, pagination).
 * Skills used: umbraco-context-api, umbraco-state-management
 */

import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import { UmbArrayState, UmbStringState, UmbNumberState } from "@umbraco-cms/backoffice/observable-api";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { NotesCollectionRepository } from "./repository/notes-collection.repository.js";
import type { NotesCollectionItemModel, NotesCollectionFilterModel } from "./types.js";
import { NOTES_COLLECTION_CONTEXT } from "./notes-collection.context-token.js";

export class NotesCollectionContext extends UmbControllerBase {
  #repository: NotesCollectionRepository;

  // State
  #items = new UmbArrayState<NotesCollectionItemModel>([], (x) => x.unique);
  readonly items = this.#items.asObservable();

  #totalItems = new UmbNumberState(0);
  readonly totalItems = this.#totalItems.asObservable();

  #filter = new UmbStringState("");
  readonly filter = this.#filter.asObservable();

  #parentUnique = new UmbStringState(undefined);
  readonly parentUnique = this.#parentUnique.asObservable();

  #loading = new UmbArrayState<boolean>([false], () => "loading");
  readonly loading = this.#loading.asObservable();

  constructor(host: UmbControllerHost) {
    super(host);
    this.provideContext(NOTES_COLLECTION_CONTEXT, this);
    this.#repository = new NotesCollectionRepository(host);
  }

  async load() {
    this.#loading.setValue([true]);

    const filterModel: NotesCollectionFilterModel = {
      filter: this.#filter.getValue() || undefined,
      parentUnique: this.#parentUnique.getValue() ?? null,
      skip: 0,
      take: 100,
    };

    const { data, error } = await this.#repository.requestCollection(filterModel);

    if (data) {
      this.#items.setValue(data.items);
      this.#totalItems.setValue(data.total);
    }

    if (error) {
      console.error("Error loading collection:", error);
    }

    this.#loading.setValue([false]);
  }

  setFilter(filter: string) {
    this.#filter.setValue(filter);
    this.load();
  }

  setParentUnique(parentUnique: string | null) {
    this.#parentUnique.setValue(parentUnique ?? undefined);
    this.load();
  }

  getItems(): NotesCollectionItemModel[] {
    return this.#items.getValue();
  }

  getParentUnique(): string | null {
    return this.#parentUnique.getValue() ?? null;
  }

  destroy() {
    this.#items.destroy();
    this.#totalItems.destroy();
    this.#filter.destroy();
    this.#parentUnique.destroy();
    this.#loading.destroy();
  }
}
