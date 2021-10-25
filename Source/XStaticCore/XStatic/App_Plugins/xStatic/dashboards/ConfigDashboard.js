angular.module("umbraco")
    .controller("xStaticConfigDashboardController", function (xStaticResource) {
        var vm = this;

        vm.config = {};

        vm.getConfig = function () {
            xStaticResource.getConfig().then(function (data) {
                vm.config = data;
            });
        }

        // on init
        vm.getConfig();
    });