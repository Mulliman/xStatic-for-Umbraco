angular.module("umbraco").controller("xStaticTypeController",
    function ($scope, $http, xStaticResource) {

        $scope.types = $scope.model.config.types;

    });