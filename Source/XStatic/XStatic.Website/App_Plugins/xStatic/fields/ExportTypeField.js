angular.module("umbraco").controller("xStaticExportTypeController",
    function ($scope, $http) {

        $scope.exportTypes = [{ id: "api", name: "JSON API" }, { id: "html", name: "HTML site" }];

        $http.get('/App_Plugins/xStatic/xStaticConfig.json').then(function (response) {
            $scope.exportTypes = response.data.exportTypes;
        });
    });