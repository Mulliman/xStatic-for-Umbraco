angular.module("umbraco").controller("xStaticExportTypeController",
    function ($scope) {
        $scope.exportTypes = [{ id: "api", name: "JSON API" }, { id: "html", name: "HTML site" }];
    });