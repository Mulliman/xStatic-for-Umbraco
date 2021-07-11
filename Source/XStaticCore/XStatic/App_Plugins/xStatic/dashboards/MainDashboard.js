angular.module("umbraco")
    .factory("xStaticResource", function ($http, umbRequestHelper) {
        return {
            getAll: function (type, sortColumn, sortOrder) {
                if (sortColumn == undefined)
                    sortColumn = "";
                if (sortOrder == undefined)
                    sortOrder = "";
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/Sites/GetAll"),
                    'Failed to get all'
                );
            },
            generateSite: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/Generate/RebuildStaticSite/?staticSiteId=" + id),
                    'Failed to generate'
                );
            },
            deploySite: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/Deploy/DeployStaticSite/?staticSiteId=" + id),
                    'Failed to generate'
                );
            },
            clearSite: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.delete("/umbraco/backoffice/xstatic/Sites/ClearStoredSite?staticSiteId=" + id),
                    'Failed to get all'
                );
            },
            getConfig: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/xstaticconfig/get"),
                    'Failed to generate'
                );
            },
        }
    })
    .controller("xStaticFormController", function ($scope, notificationsService, editorService, xStaticResource, $window, $timeout) {
        var vm = this;

        $scope.passwordFields = ["PersonalAccessToken", "Password"];

        console.log("xStaticFormController", $scope);

        //vm.createFormProperties = function (form) {
        //    var properties = [
        //        {
        //        key: "RootNode",
        //        name: "Root Node",
        //            config: { multiPicker: false, maxNumber: 1, minNumber: 0, startNode: { type: "content" } },
        //        value: form.site.RootNode,
        //        view: "/App_Plugins/xStatic/fields/multipicker.html"
        //    },
        //        {
        //        key: "MediaRootNodes",
        //        name: "Media Root Nodes",
        //        config: { multiPicker: true, maxNumber: 10, minNumber: 0, startNode: { type: "media" } },
        //            value: '', //form.site.MediaRootNodes,
        //            view: "/App_Plugins/xStatic/fields/multipicker.html"
        //        //view: "/App_Plugins/xStatic/fields/mediapicker.html"
        //        },
        //        {
        //            key: "MediaRootNodes",
        //            name: "Media Root Nodes",
        //            config: { multiPicker: true, maxNumber: 10, minNumber: 0, startNode: { type: "media" } },
        //            value: '', //form.site.MediaRootNodes,
        //            view: Umbraco.Sys.ServerVariables.umbracoSettings.appPluginsPath + "/xStatic/dashboards/Form.html"
        //            //view: "/App_Plugins/xStatic/fields/mediapicker.html"
        //        }];

        //    return properties;
        //}

        vm.createFormProperties = function (form) {
            vm.buildProperties = [
                {
                    key: "RootNode",
                    name: "Root Node",
                    config: { multiPicker: false, maxNumber: 1, minNumber: 0, startNode: { type: "content" } },
                    value: form.site.RootNode ? form.site.RootNode.toString() : null,
                    view: "/umbraco/views/propertyeditors/contentpicker/contentpicker.html"
                },
                {
                    key: "MediaRootNodes",
                    name: "Media Root Nodes",
                    config: { multiPicker: true, maxNumber: 10, minNumber: 0, startNode: { type: "media" } },
                    value: form.site.MediaRootNodes,
                    view: "/umbraco/views/propertyeditors/mediapicker/mediapicker.html"
                },
                {
                    key: "ExportFormat",
                    name: "Export Format",
                    config: null,
                    value: form.site.ExportFormat,
                    view: "/App_Plugins/xStatic/fields/ExportTypeField.html"
                },
                {
                    key: "AssetPaths",
                    name: "Asset Paths",
                    config: null,
                    value: form.site.AssetPaths,
                    view: "/umbraco/views/propertyeditors/textbox/textbox.html"
                },
                {
                    key: "ImageCrops",
                    name: "Media Crops",
                    config: null,
                    value: form.site.ImageCrops,
                    view: "/umbraco/views/propertyeditors/textbox/textbox.html"
                }];

            vm.deployProperties = [
                {
                    key: "AutoPublish",
                    name: "Auto Publish",
                    config: null,
                    value: form.site.AutoPublish,
                    view: "/umbraco/views/propertyeditors/boolean/boolean.html"
                },{
                    key: "DeploymentTarget",
                    name: "Deployment Target",
                    config: null,
                    value: form.site.DeploymentTarget,
                    view: "/App_Plugins/xStatic/fields/DeploymentTargetField.html"
                },{
                    key: "TargetHostname",
                    name: "Target Hostname",
                    config: null,
                    value: form.site.TargetHostname,
                    view: "/umbraco/views/propertyeditors/textbox/textbox.html"
                }];
        }

        vm.form = $scope.model;
        console.log($scope, vm.form, $scope.formCtrl);

        vm.createFormProperties(vm.form);

        vm.getConfig = function () {
            xStaticResource.getConfig().then(function (data) {
                vm.config = data;
                console.log("Config", vm.config);
            });
        }

        //$scope.getInputType = function (fieldName) {
        //    if ($scope.passwordFields.indexOf(fieldName) > -1) {
        //        return "password";
        //    }

        //    return "text";
        //}

        $scope.selectedDeploymentType = null;

        function submit() {
            console.log("submit pre map", vm.form);

            for (var field of vm.buildProperties) {
                vm.form.site[field.key] = field.value;
            }

            console.log("submit post map", vm.form);

            if ($scope.model.submit) {
                $scope.model.submit($scope.model);
            }
        }

        function close() {

            console.log("close", $scope.model);

            if ($scope.model.close) {
                $scope.model.close();
            }
        }

        vm.submit = submit;
        vm.close = close;

        vm.getConfig();
    })
    .controller("xStaticMainDashboardController", function ($scope, notificationsService, editorService, xStaticResource, $window, $timeout) {
        var vm = this;

        vm.openOverlay = function () {
            console.log("Hello 2");

            $scope.overlay = {
                view: Umbraco.Sys.ServerVariables.umbracoSettings.appPluginsPath + "/xStatic/dashboards/Form.html",
                title: "Set your title here",
                show: true,
                size: "large",
                submit: function (model) {

                    // do submit magic here

                    $scope.overlay.show = false;
                    $scope.overlay = null;
                },
                close: function (oldModel) {

                    // do close magic here

                    $scope.overlay.show = false;
                    $scope.overlay = null;
                }
            };
        };

        vm.open = open;

        function open(site) {
            site = site || {};

            console.log("Open", site);

            var options = {
                title: "My custom infinite editor",
                view: Umbraco.Sys.ServerVariables.umbracoSettings.appPluginsPath + "/xStatic/dashboards/Form.html",
                site: site,
                styles: { hello: "me" },
                config: { hello: "me" },
                submit: function (model) {
                    editorService.close();
                },
                close: function () {
                    editorService.close();
                }
            };
            editorService.open(options);
        };



















        vm.createLink = "#/xstatic/uiomatic/edit/generatedSite?create";
        vm.editLink = "#/xstatic/uiomatic/edit/{0}%3Fta=generatedSite";
        vm.downloadLink = "/umbraco/backoffice/xstatic/Download/DownloadStaticSite/?staticSiteId=";

        vm.sites = [];
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

        vm.getConfig = function () {
            xStaticResource.getConfig().then(function (data) {
                vm.config = data;
                console.log("Config", vm.config);
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
                    notificationsService.success("Site Generated Successfully", "The static files are now cached ready for download or deployment.");

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
    });