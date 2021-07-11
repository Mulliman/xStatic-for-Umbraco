angular.module("umbraco").controller("xStaticExportTypeController",
    function ($scope, $http, xStaticResource) {

        $scope.exportTypes = [];

        xStaticResource.getConfig().then(function (data) {
            console.log("xStaticExportTypeController", data);
            $scope.exportTypes = data.ExportTypes;
        });
    });