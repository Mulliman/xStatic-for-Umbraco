angular.module("umbraco").controller("xStaticConfigurableTypeController",
    function ($scope, $http, xStaticResource) {
        $scope.types = $scope.model.config.types;

        $scope.getInputType = function (fieldName) {
            return "text";
        }

        $scope.selectedType = null;
    });