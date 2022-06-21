angular.module("umbraco")
    .factory("xStaticResource", function ($http, umbRequestHelper) {
        return {
            getAll: function (type, sortColumn, sortOrder) {
                if (sortColumn == undefined)
                    sortColumn = "";
                if (sortOrder == undefined)
                    sortOrder = "";
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/Sites/GetAll"),
                    'Failed to get all'
                );
            },
            generateSite: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/Generate/RebuildStaticSite/?staticSiteId=" + id),
                    'Failed to generate'
                );
            },
            deploySite: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/Deploy/DeployStaticSite/?staticSiteId=" + id),
                    'Failed to generate'
                );
            },
            createSite: function (site) {
                return umbRequestHelper.resourcePromise(
                    $http.post("/umbraco/backoffice/xstatic/Sites/Create", site),
                    'Failed to update'
                );
            },
            updateSite: function (site) {
                return umbRequestHelper.resourcePromise(
                    $http.post("/umbraco/backoffice/xstatic/Sites/Update", site),
                    'Failed to update'
                );
            },
            deleteSite: function (siteId) {
                return umbRequestHelper.resourcePromise(
                    $http.delete("/umbraco/backoffice/xstatic/Sites/Delete?staticSiteId=" + siteId),
                    'Failed to delete'
                );
            },
            clearSite: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.delete("/umbraco/backoffice/xstatic/Sites/ClearStoredSite?staticSiteId=" + id),
                    'Failed to get all'
                );
            },
            getConfig: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/xstaticconfig/get"),
                    'Failed to generate'
                );
            },
        }
    })
    .factory("xStaticExportTypeResource", function ($http, umbRequestHelper) {
        return {
            createExportType: function (exportType) {
                return umbRequestHelper.resourcePromise(
                    $http.post("/umbraco/backoffice/xstatic/xstaticconfig/CreateExportType", exportType),
                    'Failed to update'
                );
            },
            updateExportType: function (exportType) {
                return umbRequestHelper.resourcePromise(
                    $http.post("/umbraco/backoffice/xstatic/xstaticconfig/UpdateExportType", exportType),
                    'Failed to update'
                );
            },
            deleteExportType: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.delete("/umbraco/backoffice/xstatic/xstaticconfig/DeleteExportType?id=" + id),
                    'Failed to delete'
                );
            },
        }
    })
    .factory("xStaticActionsResource", function ($http, umbRequestHelper) {
        return {
            getActions: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/actions/GetPostActions"),
                    'Failed to generate'
                );
            },
            createAction: function (exportType) {
                return umbRequestHelper.resourcePromise(
                    $http.post("/umbraco/backoffice/xstatic/actions/CreatePostAction", exportType),
                    'Failed to update'
                );
            },
            updateAction: function (exportType) {
                return umbRequestHelper.resourcePromise(
                    $http.post("/umbraco/backoffice/xstatic/actions/UpdatePostAction", exportType),
                    'Failed to update'
                );
            },
            deleteAction: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.delete("/umbraco/backoffice/xstatic/actions/DeletePostAction?id=" + id),
                    'Failed to delete'
                );
            },
        }
    })
    .factory("xStaticInfoResource", function ($http, umbRequestHelper) {
        return {
            getInfo: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("https://xstaticplugins.netlify.app/plugins.json"),
                    'Failed to get plugins from external URL'
                );
            },
            getHelp: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("https://xstaticplugins.netlify.app/help.json"),
                    'Failed to get help pages from external URL'
                );
            }
        }
    });