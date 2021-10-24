angular.module("umbraco")
    .factory("xStaticConfigResource", function ($http, umbRequestHelper) {
        return {
            getConfig: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/xstaticconfig/get"),
                    'Failed to generate'
                );
            }
        }
    })
    .controller("xStaticConfigDashboardController", function (xStaticConfigResource) {
        var vm = this;

        vm.config = {};

        vm.getConfig = function () {
            xStaticConfigResource.getConfig().then(function (data) {
                vm.config = data;
            });
        }

        // on init
        vm.getConfig();
    });