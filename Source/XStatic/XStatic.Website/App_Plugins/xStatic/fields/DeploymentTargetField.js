angular.module("umbraco").controller("xStaticDeploymentTargetController",
    function ($scope) {
        $scope.deploymentTypes = [{
            id: "netlify",
            name: "Netlify",
            help: "First create a personal access token at <a target='_blank' href='https://app.netlify.com/user/applications'>https://app.netlify.com/user/applications</a>. <br/> Then go to the site settings for your site, and in Site details/Site information you should see an API ID.",
            fields: {
                PersonalAccessToken: "",
                SiteId: ""
            }
        },
        {
            id: "git",
            name: "Git",
            help: "First create an empty git repo. This deployer will clone the remote and then push changes back on each deploy.",
            fields: {
                RemoteUrl: "",
                Email: "",
                Username: "",
                Password: "",
                Branch: ""
            }
        }];

        $scope.selectedDeploymentType = null;
    });