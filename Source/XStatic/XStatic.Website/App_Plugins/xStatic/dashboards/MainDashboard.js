angular.module("umbraco")
    .factory("xStaticResource", function ($http, umbRequestHelper) {
        return {
            getAll: function (type, sortColumn, sortOrder) {
                if (sortColumn == undefined)
                    sortColumn = "";
                if (sortOrder == undefined)
                    sortOrder = "";
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/UIOMatic/GeneratedSites/GetNodes?id=generatedSite&application=xstatic&tree=&use=main&culture="),
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

            console.log(vm.menu);
        });


});