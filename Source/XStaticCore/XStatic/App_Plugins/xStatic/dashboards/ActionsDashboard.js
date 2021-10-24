angular.module("umbraco")
    .factory("xStaticActionsResource", function ($http, umbRequestHelper) {
        return {
            getConfig: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/xstaticconfig/get"),
                    'Failed to generate'
                );
            },
            getActions: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.get("/umbraco/backoffice/xstatic/actions/GetPostActions"),
                    'Failed to generate'
                );
            },
            createAction: function (exportType) {
                return umbRequestHelper.resourcePromise(
                    $http.post("/umbraco/backoffice/xstatic/actions/CreatePostAction", exportType),
                    'Failed to update'
                );
            },
            updateAction: function (exportType) {
                return umbRequestHelper.resourcePromise(
                    $http.post("/umbraco/backoffice/xstatic/actions/UpdatePostAction", exportType),
                    'Failed to update'
                );
            },
            deleteAction: function (id) {
                return umbRequestHelper.resourcePromise(
                    $http.delete("/umbraco/backoffice/xstatic/actions/DeletePostAction?id=" + id),
                    'Failed to delete'
                );
            },
        }
    })
    .service("xStaticActionsEditingService", function ($http, umbRequestHelper, xStaticActionsResource) {

        this.editorTypes = {
            // Umbraco
            textbox: "/umbraco/views/propertyeditors/textbox/textbox.html",
            checkbox: "/umbraco/views/propertyeditors/boolean/boolean.html",
            typeField: "/App_Plugins/xStatic/fields/TypeField.html",
            configurableTypeField: "/App_Plugins/xStatic/fields/ConfigurableTypeField.html",

        };

        this.getProperties = function (form, config) {
            console.log("getProperties", form, form.action);

            return [
                {
                    key: "Type",
                    name: "Type",
                    description: "The class that defines which action to perform.",
                    config: { types: config.PostGenerationActions },
                    value: form.action.Type,
                    view: this.editorTypes.configurableTypeField
                }];
        };

        this.updateFormValues = function (form, props) {
            for (var field of props) {
                var val = field.value;

                if (field.key = "Type") {
                    console.log("updateFormValues", field);
                    console.log("val", val);

                    if (val) {
                        form.action[field.key] = val.Id;
                        form.action["Config"] = val.Fields;
                    } else {
                        form.action[field.key] = null;
                        form.action["Config"] = null;
                    }
                    

                    console.log("type vals", form.action[field.key], form.action["Config"]);
                }
            }

            return form;
        }

    })
    .controller("xStaticActionsFormController", function ($scope, notificationsService, editorService, xStaticActionsResource, xStaticActionsEditingService, $window, $timeout) {
        var vm = this;

        vm.form = $scope.model;

        vm.properties = xStaticActionsEditingService.getProperties(vm.form, $scope.model.configValues);

        vm.submit = function() {
            vm.form = xStaticActionsEditingService.updateFormValues(vm.form, vm.properties);

            if (vm.form.action.Id) {
                xStaticActionsResource.updateAction(vm.form.action).then(function (data) {
                    console.log("saved", data);
                    if ($scope.model.submit) {
                        $scope.model.submit($scope.model);
                    }
                });
            } else {
                xStaticActionsResource.createAction(vm.form.action).then(function (data) {
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
    .controller("xStaticActionsDashboardController", function ($scope, notificationsService, editorService, xStaticActionsResource, $window, $timeout) {
        var vm = this;

        vm.actions = [];
        vm.config = {};

        vm.getActions = function () {
            xStaticActionsResource.getActions().then(function (data) {
                vm.actions = data;
            });
        }

        vm.getConfig = function () {
            xStaticActionsResource.getConfig().then(function (data) {
                vm.config = data;
            });
        }

        vm.open = open;

        function open(action) {
            action = action || {};

            console.log("Open", action);

            var options = {
                title: "My custom infinite editor",
                view: Umbraco.Sys.ServerVariables.umbracoSettings.appPluginsPath + "/xStatic/dashboards/ActionForm.html",
                action: action,
                configValues: vm.config,
                styles: { },
                config: { },
                submit: function (model) {
                    editorService.close();
                    vm.getConfig();
                    vm.getActions();
                },
                close: function () {
                    editorService.close();
                }
            };
            editorService.open(options);
        };

        vm.delete = function (id) {
            if (confirm("Are you sure you want to delete this action?")) {
                xStaticActionsResource.deleteAction(id).then(function () {
                    vm.getConfig();
                    vm.getActions();
                });
            }
        }

        // on init
        vm.getActions();
        vm.getConfig();
    });