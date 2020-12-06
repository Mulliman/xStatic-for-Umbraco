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
            generate: function () {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/Generate/Test"),
                    'Failed to get all'
                );
            },
            generateSite: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/Generate/RebuildStaticSite/?staticSiteId=" + id),
                    'Failed to generate'
                );
            },
        }
    })
    .controller("xStaticMainDashboardController", function ($scope, notificationsService, xStaticResource) {
        var vm = this;

        vm.sites = [];

        vm.getSites = function () {
            xStaticResource.getAll().then(function (data) {
                vm.sites = data;
            });
        }

        vm.generate = function () {
            xStaticResource.generate().then(function (data) {
                console.log("generated file", data);

                vm.getSites();
            });
        }

        vm.generateSite = function (id) {
            xStaticResource.generateSite(id).then(function (data) {
                console.log("generated files", data);

                notificationsService.success("Site Generated Successfully", "The static files are now cached ready for download or deployment.");

                vm.getSites();
            });
        }

        // on init
        vm.getSites();
    });