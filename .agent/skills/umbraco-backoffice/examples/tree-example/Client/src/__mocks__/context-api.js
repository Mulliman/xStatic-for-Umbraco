// Mock for @umbraco-cms/backoffice/context-api
export class UmbContextToken {
  constructor(alias, apiAlias, defaultValue) {
    this.alias = alias;
    this.apiAlias = apiAlias;
    this.defaultValue = defaultValue;
  }
}
