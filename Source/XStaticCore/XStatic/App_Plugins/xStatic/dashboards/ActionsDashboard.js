angular.module("umbraco")
    .service("xStaticActionsEditingService", function () {

        this.editorTypes = {
            textbox: "/umbraco/views/propertyeditors/textbox/textbox.html",
            checkbox: "/umbraco/views/propertyeditors/boolean/boolean.html",
            typeField: "/App_Plugins/xStatic/fields/TypeField.html",
            configurableTypeField: "/App_Plugins/xStatic/fields/ConfigurableTypeField.html",
        };

        this.getProperties = function (form, config) {
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
                    if (val) {
                        form.action[field.key] = val.Id;
                        form.action["Config"] = val.Fields;
                    } else {
                        form.action[field.key] = null;
                        form.action["Config"] = null;
                    }
                }
            }

            return form;
        }

    })
    .controller("xStaticActionsFormController", function ($scope, xStaticActionsResource, xStaticActionsEditingService) {
        var vm = this;

        vm.form = $scope.model;

        vm.properties = xStaticActionsEditingService.getProperties(vm.form, $scope.model.configValues);

        vm.submit = function() {
            vm.form = xStaticActionsEditingService.updateFormValues(vm.form, vm.properties);

            if (vm.form.action.Id) {
                xStaticActionsResource.updateAction(vm.form.action).then(function (data) {
                    if ($scope.model.submit) {
                        $scope.model.submit($scope.model);
                    }
                });
            } else {
                xStaticActionsResource.createAction(vm.form.action).then(function (data) {
                    if ($scope.model.submit) {
                        $scope.model.submit($scope.model);
                    }
                });
            }
        }

        vm.close = function() {
            if ($scope.model.close) {
                $scope.model.close();
            }
        }
    })
    .controller("xStaticActionsDashboardController", function ($scope, editorService, xStaticResource, xStaticActionsResource) {
        var vm = this;

        vm.actions = [];
        vm.config = {};

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

        vm.open = open;

        function open(action) {
            action = action || {};

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