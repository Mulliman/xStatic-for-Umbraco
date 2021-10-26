angular.module("umbraco")
    .controller("xStaticInfoDashboardController", function (xStaticInfoResource) {
        var vm = this;

        vm.plugins = [];
        vm.helpPages = [];

        vm.getInfo = function () {
            xStaticInfoResource.getInfo().then(function (data) {
                vm.plugins = data;
            });
        }

        vm.getHelp = function () {
            xStaticInfoResource.getHelp().then(function (data) {
                vm.helpPages = data;
            });
        }

        // on init
        vm.getInfo();
        vm.getHelp();
    });