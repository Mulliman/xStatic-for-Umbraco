angular.module("umbraco").controller("xStaticDeploymentTargetController",
    function ($scope, $http) {
        $scope.passwordFields = ["PersonalAccessToken", "Password"];

        $scope.deploymentTypes = [];

        $http.get('/App_Plugins/xStatic/xStaticConfig.json').then(function (response) {
            $scope.deploymentTypes = response.data.deployers;
        });

        $scope.getInputType = function (fieldName) {
            if ($scope.passwordFields.indexOf(fieldName) > -1) {
                return "password";
            }

            return "text";
        }

        $scope.selectedDeploymentType = null;
    });