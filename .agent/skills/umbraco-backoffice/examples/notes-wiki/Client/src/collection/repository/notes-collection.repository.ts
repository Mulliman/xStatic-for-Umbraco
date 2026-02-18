/**
 * Notes Collection Repository
 *
 * Repository for fetching notes collection data.
 * Skills used: umbraco-repository-pattern
 */

import { UmbRepositoryBase } from "@umbraco-cms/backoffice/repository";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { NotesCollectionServerDataSource } from "./notes-collection.server.data-source.js";
import type { NotesCollectionFilterModel } from "../types.js";

export class NotesCollectionRepository extends UmbRepositoryBase {
  #collectionSource: NotesCollectionServerDataSource;

  constructor(host: UmbControllerHost) {
    super(host);
    this.#collectionSource = new NotesCollectionServerDataSource();
  }

  async requestCollection(filter: NotesCollectionFilterModel) {
    return this.#collectionSource.getCollection(filter);
  }
}
