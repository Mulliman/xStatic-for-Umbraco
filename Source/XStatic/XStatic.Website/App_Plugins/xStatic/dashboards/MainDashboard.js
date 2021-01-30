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
            clearSite: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.delete("/umbraco/backoffice/xstatic/Sites/ClearStoredSite?staticSiteId=" + id),
                    'Failed to get all'
                );
            },
        }
    })
    .controller("xStaticMainDashboardController", function ($scope, notificationsService, xStaticResource, $window, $timeout) {
        var vm = this;

        vm.createLink = "#/xstatic/uiomatic/edit/generatedSite?create";
        vm.editLink = "#/xstatic/uiomatic/edit/{0}%3Fta=generatedSite";
        vm.downloadLink = "/umbraco/backoffice/xstatic/Download/DownloadStaticSite/?staticSiteId=";

        vm.sites = [];

        vm.timers = [];
        vm.deployTimers = [];
        vm.currentTime = [];
        vm.currentDeployTime = [];

        vm.getSites = function () {
            xStaticResource.getAll().then(function (data) {
                vm.sites = data;
            });
        }

        vm.editSite = function (id) {
            $window.location.href = vm.editLink.replace("{0}", id);
        }

        vm.generateSite = function (id) {

            vm.currentTime[id] = 1;

            vm.timers[id] = setInterval(function () {
                vm.currentTime[id] = vm.currentTime[id] + 1;
                $scope.$apply();
            }, 1000);

            setTimeout(function () {
                xStaticResource.generateSite(id).then(function (data) {
                    notificationsService.success("Site Generated Successfully", "The static files are now cached ready for download or deployment.");

                    vm.getSites();

                    vm.currentTime[id] = 0;
                    clearInterval(vm.timers[id]);
                });
            }, 1000);
        }

        vm.deploySite = function (id) {
            vm.currentDeployTime[id] = 1;

            vm.deployTimers[id] = setInterval(function () {
                vm.currentDeployTime[id] = vm.currentDeployTime[id] + 1;
                $scope.$apply();
            }, 1000);

            setTimeout(function () {
                xStaticResource.deploySite(id).then(function (data) {
                    if (data && data.WasSuccessful) {
                        notificationsService.success("Site Deployed Successfully", "Your site is updated.");
                    } else {
                        notificationsService.error("Site Deploy Error", data.Message);
                    }

                    vm.getSites();

                    vm.currentDeployTime[id] = 0;
                    clearInterval(vm.deployTimers[id]);
                }, function (err) {
                    vm.currentDeployTime[id] = 0;
                    clearInterval(vm.deployTimers[id]);
                    notificationsService.error("Site Deploy Error", data.Message);
                });
            }, 1000);
        }

        vm.clearData = function (site) {
            xStaticResource.clearSite(site).then(function (data) {
                notificationsService.success("Site Cleared Successfully");
                vm.sites = data;
            });
        }

        vm.downloadSite = function (id) {
            $window.open(vm.downloadLink + id, '_blank');
        }

        vm.formatTime = function(duration){
            if (!duration) {
                return "N/A";
            }

            // Hours, minutes and seconds
            var hrs = ~~(duration / 3600);
            var mins = ~~((duration % 3600) / 60);
            var secs = ~~duration % 60;

            // Output like "1:01" or "4:03:59" or "123:03:59"
            var ret = "";

            if (hrs > 0) {
                ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
            }

            ret += "" + mins + ":" + (secs < 10 ? "0" : "");
            ret += "" + secs;
            return ret;
        }

        // on init
        vm.getSites();
    });