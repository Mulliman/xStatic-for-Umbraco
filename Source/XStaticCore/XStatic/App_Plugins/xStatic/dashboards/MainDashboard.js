angular.module("umbraco")
    .service("xStaticSiteEditingService", function ($http, umbRequestHelper) {

        this.editorTypes = {
            // Umbraco
            textbox: "/umbraco/views/propertyeditors/textbox/textbox.html",
            checkbox: "/umbraco/views/propertyeditors/boolean/boolean.html",
            csv: "/umbraco/views/propertyeditors/textbox/textbox.html",
            contentPicker: "/umbraco/views/propertyeditors/contentpicker/contentpicker.html",
            mediaPicker: "/umbraco/views/propertyeditors/mediapicker/mediapicker.html",
            // Custom
            exportType: "/App_Plugins/xStatic/fields/ExportTypeField.html",
            deploymentTarget: "/App_Plugins/xStatic/fields/DeploymentTargetField.html",
            checkBoxList: "/App_Plugins/xStatic/fields/CheckBoxListField.html"
        };

        this.getBuildProperties = function (form, actions) {
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
                    description: "Comma delimit the image crops you want to generate in the format {width}x{height}. You can also optionally add compression after each with @{quality}. E.g. 1600x900@80,800x450@50,320x0",
                    config: null,
                    value: form.site.ImageCrops,
                    view: this.editorTypes.csv
                },
                {
                    key: "PostGenerationActionIds",
                    name: "Post Generation Actions",
                    description: "Choose which actions should be performed once the pages have been created.",
                    config: { actions: actions },
                    value: form.site.PostGenerationActionIds,
                    view: this.editorTypes.checkBoxList
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
    .controller("xStaticFormController", function ($scope, notificationsService, editorService, xStaticResource, xStaticSiteEditingService, $window, $timeout) {
        var vm = this;

        $scope.passwordFields = ["PersonalAccessToken", "Password"];

        vm.form = $scope.model;

        vm.buildProperties = xStaticSiteEditingService.getBuildProperties(vm.form, $scope.model.actions);
        vm.deployProperties = xStaticSiteEditingService.getDeployProperties(vm.form);

        vm.submit = function () {
            vm.form = xStaticSiteEditingService.updateFormValues(vm.form, vm.buildProperties, vm.deployProperties);

            if (vm.form.site.Id) {
                xStaticResource.updateSite(vm.form.site).then(function (data) {
                    if ($scope.model.submit) {
                        $scope.model.submit($scope.model);
                    }
                });
            } else {
                xStaticResource.createSite(vm.form.site).then(function (data) {
                    if ($scope.model.submit) {
                        $scope.model.submit($scope.model);
                    }
                });
            }
        }

        vm.close = function () {
            if ($scope.model.close) {
                $scope.model.close();
            }
        }
    })
    .controller("xStaticMainDashboardController", function ($scope, notificationsService, editorService, xStaticResource, xStaticActionsResource, $window, $timeout) {
        var vm = this;

        vm.open = open;

        function open(site) {
            site = site || {};

            var options = {
                title: "My custom infinite editor",
                view: Umbraco.Sys.ServerVariables.umbracoSettings.appPluginsPath + "/xStatic/dashboards/Form.html",
                site: site,
                actions: vm.actions,
                styles: {},
                config: {},
                submit: function (model) {
                    editorService.close();
                    vm.getSites();
                },
                close: function () {
                    editorService.close();
                }
            };
            editorService.open(options);
        };

        vm.delete = function (id) {
            if (confirm("Are you sure you want to delete this site?")) {
                xStaticResource.deleteSite(id).then(function () {
                    vm.getSites();
                });
            }
        }

        vm.downloadLink = "/umbraco/backoffice/xstatic/Download/DownloadStaticSite/?staticSiteId=";

        vm.sites = [];
        vm.actions = [];
        vm.config = {};

        vm.timers = [];
        vm.deployTimers = [];
        vm.currentTime = [];
        vm.currentDeployTime = [];

        vm.getSites = function () {
            xStaticResource.getAll().then(function (data) {
                vm.sites = data;
            });
        }

        vm.getActions = function () {
            xStaticActionsResource.getActions().then(function (data) {
                vm.actions = data;
            });
        }

        vm.getConfig = function () {
            xStaticResource.getConfig().then(function (data) {
                vm.config = data;
            });
        }

        vm.editSite = function (id) {
            $window.location.href = vm.editLink.replace("{0}", id);
        }

        vm.generateSite = function (id) {

            vm.currentTime[id] = 1;

            vm.timers[id] = setInterval(function () {
                vm.currentTime[id] = vm.currentTime[id] + 1;
                $scope.$apply();
            }, 1000);

            setTimeout(function () {
                xStaticResource.generateSite(id).then(function (data) {

                    if (data.WasSuccessful) {
                        notificationsService.success("Site Generated Successfully", "The static files are now cached ready for download or deployment.");
                    } else if (data.Warnings && data.Warnings.length) {

                        for (var warning of data.Warnings) {
                            var message = warning.Type + " - " + warning.Item + " => " + warning.Message;
                            notificationsService.warning("Site Generation Warning", message);
                        }

                    } else {
                        notificationsService.error("Site Generation Error", data.Exception + " " + data.ExceptionTrace);
                    }

                    vm.getSites();

                    vm.currentTime[id] = 0;
                    clearInterval(vm.timers[id]);
                });
            }, 1000);
        }

        vm.deploySite = function (id) {
            vm.currentDeployTime[id] = 1;

            vm.deployTimers[id] = setInterval(function () {
                vm.currentDeployTime[id] = vm.currentDeployTime[id] + 1;
                $scope.$apply();
            }, 1000);

            setTimeout(function () {
                xStaticResource.deploySite(id).then(function (data) {
                    if (data && data.WasSuccessful) {
                        notificationsService.success("Site Deployed Successfully", "Your site is updated.");
                    } else {
                        notificationsService.error("Site Deploy Error", data.Message);
                    }

                    vm.getSites();

                    vm.currentDeployTime[id] = 0;
                    clearInterval(vm.deployTimers[id]);
                }, function (err) {
                    vm.currentDeployTime[id] = 0;
                    clearInterval(vm.deployTimers[id]);
                    notificationsService.error("Site Deploy Error", data.Message);
                });
            }, 1000);
        }

        vm.clearData = function (site) {
            xStaticResource.clearSite(site).then(function (data) {
                notificationsService.success("Site Cleared Successfully");
                vm.sites = data;
            });
        }

        vm.downloadSite = function (id) {
            $window.open(vm.downloadLink + id, '_blank');
        }

        vm.formatTime = function (duration) {
            if (!duration) {
                return "N/A";
            }

            // Hours, minutes and seconds
            var hrs = ~~(duration / 3600);
            var mins = ~~((duration % 3600) / 60);
            var secs = ~~duration % 60;

            // Output like "1:01" or "4:03:59" or "123:03:59"
            var ret = "";

            if (hrs > 0) {
                ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
            }

            ret += "" + mins + ":" + (secs < 10 ? "0" : "");
            ret += "" + secs;
            return ret;
        }

        // on init
        vm.getSites();
        vm.getConfig();
        vm.getActions();
    });