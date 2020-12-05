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
        }
    })
    .controller("xStaticMainDashboardController", function ($scope, xStaticResource) {
        var vm = this;

        vm.sites = [];

        xStaticResource.getAll().then(function (data) {
            vm.sites = data;

            console.log("sites", vm.sites);
        });


});