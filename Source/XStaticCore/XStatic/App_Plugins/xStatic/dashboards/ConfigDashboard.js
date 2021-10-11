angular.module("umbraco")
    .factory("xStaticConfigResource", function ($http, umbRequestHelper) {
        return {
            getConfig: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/xstaticconfig/get"),
                    'Failed to generate'
                );
            }
        }
    })
    .service("xStaticConfigEditingService", function ($http, umbRequestHelper) {

        this.editorTypes = {
            // Umbraco
            textbox: "/umbraco/views/propertyeditors/textbox/textbox.html",
            checkbox: "/umbraco/views/propertyeditors/boolean/boolean.html"
        };

        this.getBuildProperties = function (form) {
            return [
                {
                    key: "RootNode",
                    name: "Root Node",
                    description: "Select the root of the site you want to create a static version of.",
                    config: { multiPicker: false, maxNumber: 1, minNumber: 0, startNode: { type: "content" } },
                    value: form.site.RootNode ? form.site.RootNode.toString() : null,
                    view: this.editorTypes.contentPicker
                },
                {
                    key: "MediaRootNodes",
                    name: "Media Root Nodes",
                    description: "Select the media folders you want to include in your static site.",
                    config: { multiPicker: true, maxNumber: 10, minNumber: 0, startNode: { type: "media" } },
                    value: form.site.MediaRootNodes,
                    view: this.editorTypes.mediaPicker
                },
                {
                    key: "ExportFormat",
                    name: "Export Format",
                    description: "Do you want to export this site as a JSON API or as a static HTML website.",
                    config: null,
                    value: form.site.ExportFormat,
                    view: this.editorTypes.exportType
                },
                {
                    key: "AssetPaths",
                    name: "Asset Paths",
                    description: "Add folder names of files on disk that should also be packaged up. Comma separate e.g. /assets/js,/assets/css",
                    config: null,
                    value: form.site.AssetPaths,
                    view: this.editorTypes.csv
                },
                {
                    key: "ImageCrops",
                    name: "Media Crops",
                    description: "Comma delimit the image crops you want to generate in the format {width}x{height}. E.g. 1600x900,800x450,320x0",
                    config: null,
                    value: form.site.ImageCrops,
                    view: this.editorTypes.csv
                }];
        };

        this.getDeployProperties = function (form) {
            return [
                {
                    key: "AutoPublish",
                    name: "Auto Publish",
                    description: "Select this is you want to generate the site automatically when a node is published.",
                    config: null,
                    value: form.site.AutoPublish,
                    view: this.editorTypes.checkbox
                }, {
                    key: "DeploymentTarget",
                    name: "Deployment Target",
                    description: "Configure your deployment target by filling in all required settings.",
                    config: null,
                    value: form.site.DeploymentTarget,
                    view: this.editorTypes.deploymentTarget
                }, {
                    key: "TargetHostname",
                    name: "Target Hostname",
                    description: "The site hostname you've configured for viewing the site locally will be replaced with this value.",
                    config: null,
                    value: form.site.TargetHostname,
                    view: this.editorTypes.textbox
                }];
        };

        this.updateFormValues = function (form, buildProps, deployProps) {
            for (var field of buildProps) {
                var val = field.value;

                if (field.key == "RootNode" && val) {
                    val = parseInt(val);
                }

                form.site[field.key] = val;
            }

            for (var field of deployProps) {
                var val = field.value;

                if (field.key == "AutoPublish") {
                    val = val == "1";
                }

                form.site[field.key] = val;
            }

            return form;
        }

    })
    .controller("xStaticConfigController", function ($scope, notificationsService, editorService, xStaticResource, xStaticSiteEditingService, $window, $timeout) {
        var vm = this;

        $scope.passwordFields = ["PersonalAccessToken", "Password"];

        console.log("xStaticConfigController", $scope);

        vm.form = $scope.model;

        vm.buildProperties = xStaticSiteEditingService.getBuildProperties(vm.form);
        vm.deployProperties = xStaticSiteEditingService.getDeployProperties(vm.form);

        vm.submit = function() {
            
        }

        vm.close = function() {
            console.log("close", $scope.model);

            if ($scope.model.close) {
                $scope.model.close();
            }
        }
    })
    .controller("xStaticConfigDashboardController", function ($scope, notificationsService, editorService, xStaticConfigResource, $window, $timeout) {
        var vm = this;

        vm.sites = [];
        vm.config = {};

        vm.getConfig = function () {
            xStaticConfigResource.getConfig().then(function (data) {
                vm.config = data;
                console.log("Config", vm.config);
            });
        }

        vm.editSite = function (id) {
            $window.location.href = vm.editLink.replace("{0}", id);
        }

        // on init
        vm.getConfig();
    });