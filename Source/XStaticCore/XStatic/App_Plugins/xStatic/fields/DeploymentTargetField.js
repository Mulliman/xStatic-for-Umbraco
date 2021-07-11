angular.module("umbraco").controller("xStaticDeploymentTargetController",
    function ($scope, $http, xStaticResource) {
        $scope.passwordFields = ["PersonalAccessToken", "Password"];

        $scope.deploymentTypes = [];

        xStaticResource.getConfig().then(function (data) {
            $scope.deploymentTypes = data.Deployers;
        });

        $scope.getInputType = function (fieldName) {
            if ($scope.passwordFields.indexOf(fieldName) > -1) {
                return "password";
            }

            return "text";
        }

        $scope.selectedDeploymentType = null;
    });