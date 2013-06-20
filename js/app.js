(function () {
    var app = angular.module("tcga-patient-dashboard", []);

 // Library Wrappers
    app.constant("d3", d3);
    app.constant("dc", dc);
    app.constant("ming", ming);
    app.constant("crossfilter", crossfilter);

    app.factory("MingDB", function (ming) {
        var database, endpoint, password, username;
        endpoint = "http://ifx.path.uab.edu/ming/server";
        username = "test";
        password = "Test123";
        database = ming({endpoint: endpoint, username: username, password: password});
        return database;
    });

    app.factory("Fields", function ($q, $rootScope, MingDB) {
        var d, fields;
        d = $q.defer();
        fields = d.promise;
        MingDB.collection("tcgaPatientsFields", function (err, collection) {
            if (err) $rootScope.$apply(function () {d.reject(err);});
            else {
                collection.find({ value: 13892 }, function (err, remote_fields) {
                    $rootScope.$apply(function () {
                        if (err) d.reject(err);
                        else {
                            fields = remote_fields;
                            d.resolve(remote_fields);
                        }
                    });
                });
            }
        });
        return {
            list : function () {
                return $q.when(fields);
            }
        };
    });

    app.factory("Patients", function ($q, $rootScope, crossfilter, Fields, MingDB) {
        var filter, dimensions = {}, groups = {}, d;
        d = $q.defer();
        filter = d.promise;
        MingDB.collection("tcgaPatientsLite", function (err, collection) {
            if (err) $rootScope.$apply(function () {d.reject(err);});
            else {
                collection.find({}, {limit:10}, function (err, patients) {
                    $rootScope.$apply(function () {
                        if (err) d.reject(err);
                        else {
                            filter = crossfilter(patients);
                            d.resolve(filter);
                        }
                    });
                });
            }
        });
        return {

            filter : function () {
                return $q.when(filter);
            },

            dimension : function (name, value) {
                if (!value && dimensions[name]) return $q.when(dimensions[name]);
                else {
                    return $q.when(filter).then(function (filter) {
                        return filter.dimension(value);
                    }).then(function (dimension) {
                        dimensions[name] = dimension;
                        return dimension;
                    });
                }
            },

            group : function (groupName, dimensionName) {
                if (groups[groupName]) return $q.when(groups[groupname]);
                else {
                    $q.all([filter, this.dimension(dimensionName)]).then(function (vals) {
                        var dimension = vals[1];
                        return dimension.group();
                    }).then(function (group) {
                        groups[groupName] = group;
                        return group;
                    });
                }
            }
        };
    });

    app.directive("fieldlist", function (Fields, $window, $rootScope) {
        return {
            restrict : "E",
            replace : true,
            link : function ($scope, $element, $attrs) {
                $window.r = $rootScope;
                $scope.fields = Fields.list();
            },
            template : "<ul><li ng-repeat=\"field in fields\">{{field._id}}</li></ul>"
        };
    });

    app.controller("patiently", function ($scope, Patients) {
        $scope.patients = Patients.filter();
    });

    app.controller("gender", function ($scope, $window, dc, Patients) {
        var dimension, group;
        $scope.dimension = Patients.dimension("gender", function (d) { return d.gender; });
        $scope.group = Patients.group();
        $window.ss = $scope;
    });

})();
