angular.module("umbraco").controller("xStaticCheckBoxListController",
    function ($scope, $http, xStaticResource) {

        $scope.actions = $scope.model.config.actions;
        $scope.model.value = $scope.model.value || [];

        console.log("xStaticCheckBoxListController", $scope.actions, $scope.model.value);

        $scope.toggle = function (action) {
            if ($scope.model.value.indexOf(action) === -1) {
                $scope.model.value.push(action);
            } else {
                $scope.model.value.splice($scope.model.value.indexOf(action), 1);
            }
        };
    });