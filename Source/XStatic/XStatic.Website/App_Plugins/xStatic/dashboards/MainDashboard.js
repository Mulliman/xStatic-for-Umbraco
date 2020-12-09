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
            deploySite: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/Deploy/DeployStaticSite/?staticSiteId=" + id),
                    'Failed to generate'
                );
            },
        }
    })
    .controller("xStaticMainDashboardController", function ($scope, notificationsService, xStaticResource, $window) {
        var vm = this;

        vm.createLink = "#/xstatic/uiomatic/edit/generatedSite?create";
        vm.editLink = "#/xstatic/uiomatic/edit/{0}%3Fta=generatedSite";
        vm.downloadLink = "/umbraco/backoffice/xstatic/Download/DownloadStaticSite/?staticSiteId=";

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

        vm.editSite = function (id) {
            $window.location.href = vm.editLink.replace("{0}", id);
        }

        vm.generateSite = function (id) {
            xStaticResource.generateSite(id).then(function (data) {
                console.log("generated files", data);

                notificationsService.success("Site Generated Successfully", "The static files are now cached ready for download or deployment.");

                vm.getSites();
            });
        }

        vm.deploySite = function (id) {
            console.log("deploying", id);

            xStaticResource.deploySite(id).then(function (data) {
                console.log("deployed files", data);

                if (data) {
                    notificationsService.success("Site Deployed Successfully", "Your site is updated.");
                } else {
                    alert("Bad");
                }
                

                vm.getSites();
            });
        }

        vm.downloadSite = function (id) {
            console.log("downloading", id);

            $window.open(vm.downloadLink + id, '_blank');
        }

        // on init
        vm.getSites();
    });