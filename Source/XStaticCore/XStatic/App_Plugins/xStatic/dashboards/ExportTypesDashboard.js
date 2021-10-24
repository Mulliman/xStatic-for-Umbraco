angular.module("umbraco")
    .factory("xStaticExportTypeResource", function ($http, umbRequestHelper) {
        return {
            getConfig: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/xstaticconfig/get"),
                    'Failed to generate'
                );
            },
            createExportType: function (exportType) {
                return umbRequestHelper.resourcePromise(
                    $http.post("/umbraco/backoffice/xstatic/xstaticconfig/CreateExportType", exportType),
                    'Failed to update'
                );
            },
            updateExportType: function (exportType) {
                return umbRequestHelper.resourcePromise(
                    $http.post("/umbraco/backoffice/xstatic/xstaticconfig/UpdateExportType", exportType),
                    'Failed to update'
                );
            },
            deleteExportType: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.delete("/umbraco/backoffice/xstatic/xstaticconfig/DeleteExportType?id=" + id),
                    'Failed to delete'
                );
            },
        }
    })
    .service("xStaticExportTypeEditingService", function ($http, umbRequestHelper, xStaticExportTypeResource) {

        this.editorTypes = {
            // Umbraco
            textbox: "/umbraco/views/propertyeditors/textbox/textbox.html",
            checkbox: "/umbraco/views/propertyeditors/boolean/boolean.html",
            typeField: "/App_Plugins/xStatic/fields/TypeField.html"
        };

        this.getProperties = function (form, config) {
            console.log("getProperties", form, form.exportType.TransformerFactory);

            return [
                {
                    key: "TransformerFactory",
                    name: "Transformer List Factory",
                    description: "The class that define which transformers should be run on the generated data and in which order.",
                    config: { types: config.TransformerFactories },
                    value: form.exportType.TransformerFactory ? form.exportType.TransformerFactory.Id : null,
                    view: this.editorTypes.typeField
                },
                {
                    key: "Generator",
                    name: "Generator",
                    description: "The class that builds the static assets from the Umbraco pages.",
                    config: { types: config.Generators },
                    value: form.exportType.Generator ? form.exportType.Generator.Id : null,
                    view: this.editorTypes.typeField
                },
                {
                    key: "FileNameGenerator",
                    name: "File Name Generator",
                    description: "The class that names the static files generated.",
                    config: { types: config.FileNameGenerators },
                    value: form.exportType.FileNameGenerator ? form.exportType.FileNameGenerator.Id : null,
                    view: this.editorTypes.typeField
                }];
        };

        this.updateFormValues = function (form, props) {
            for (var field of props) {
                var val = field.value;

                form.exportType[field.key] = val;
            }

            return form;
        }

    })
    .controller("xStaticExportTypeFormController", function ($scope, notificationsService, editorService, xStaticExportTypeResource, xStaticExportTypeEditingService, $window, $timeout) {
        var vm = this;

        vm.form = $scope.model;

        vm.properties = xStaticExportTypeEditingService.getProperties(vm.form, $scope.model.configValues);

        vm.submit = function() {
            vm.form = xStaticExportTypeEditingService.updateFormValues(vm.form, vm.properties);

            console.log("pre save exportType", vm.form.exportType);

            if (vm.form.exportType.Id) {
                xStaticExportTypeResource.updateExportType(vm.form.exportType).then(function (data) {
                    console.log("saved", data);
                    if ($scope.model.submit) {
                        $scope.model.submit($scope.model);
                    }
                });
            } else {
                xStaticExportTypeResource.createExportType(vm.form.exportType).then(function (data) {
                    console.log("created", data);
                    if ($scope.model.submit) {
                        $scope.model.submit($scope.model);
                    }
                });
            }
        }

        vm.close = function() {
            console.log("close", $scope.model);

            if ($scope.model.close) {
                $scope.model.close();
            }
        }
    })
    .controller("xStaticExportTypeDashboardController", function (editorService, xStaticExportTypeResource) {
        var vm = this;

        vm.sites = [];
        vm.config = {};

        vm.getConfig = function () {
            xStaticExportTypeResource.getConfig().then(function (data) {
                vm.config = data;
            });
        }

        vm.open = open;

        function open(exportType) {
            exportType = exportType || {};

            console.log("Open", exportType);

            var options = {
                title: "My custom infinite editor",
                view: Umbraco.Sys.ServerVariables.umbracoSettings.appPluginsPath + "/xStatic/dashboards/ExportTypeForm.html",
                exportType: exportType,
                configValues: vm.config,
                styles: { },
                config: { },
                submit: function (model) {
                    editorService.close();
                    vm.getConfig();
                },
                close: function () {
                    editorService.close();
                }
            };
            editorService.open(options);
        };

        vm.delete = function (id) {
            if (confirm("Are you sure you want to delete this export type?")) {
                xStaticExportTypeResource.deleteExportType(id).then(function () {
                    vm.getConfig();
                });
            }
        }

        // on init
        vm.getConfig();
    });