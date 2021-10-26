angular.module("umbraco")
    .controller("xStaticInfoDashboardController", function (xStaticInfoResource) {
        var vm = this;

        vm.plugins = {};

        vm.getInfo = function () {
            xStaticInfoResource.getInfo().then(function (data) {
                vm.plugins = data;
            });
        }

        // on init
        vm.getInfo();
    });