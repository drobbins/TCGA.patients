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
                collection.find({}, {}, function (err, patients) {
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
                    var d = $q.defer();
                    dimensions[name] = d.promise;
                    return $q.when(filter).then(function (filter) {
                        return filter.dimension(value);
                    }).then(function (dimension) {
                        d.resolve(dimension);
                        dimensions[name] = dimension;
                        return dimension;
                    });
                }
            },

            group : function (groupName, dimensionName) {
                if (groups[groupName]) return $q.when(groups[groupname]);
                else {
                    return $q.all([filter, this.dimension(dimensionName)]).then(function (vals) {
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

    app.controller("gender", function ($scope, $q, dc, Patients) {
        var dimension, group;
        dimension = Patients.dimension("gender", function (d) { return d.gender; });
        group = Patients.group("genderGroup", "gender");
        $q.all([dimension, group]).then(function (things) {

            dc.pieChart("[ng-controller='gender']")
                .width(210)
                .height(210)
                .dimension(things[0])
                .group(things[1])
                .innerRadius(25)
                .radius(100);
            dc.renderAll();

        });
    });

    app.controller("vital_status", function ($scope, $q, dc, Patients) {
        var dimension, group;
        dimension = Patients.dimension("vital_status", function (d) { return d.vital_status; });
        group = Patients.group("vital_statusGroup", "vital_status");
        $q.all([dimension, group]).then(function (things) {

            dc.pieChart("[ng-controller='vital_status']")
                .width(210)
                .height(210)
                .dimension(things[0])
                .group(things[1])
                .innerRadius(25)
                .radius(100);
            dc.renderAll();

        });
    });

    app.controller("race", function ($scope, $q, dc, Patients) {
        var dimension, group;
        dimension = Patients.dimension("race", function (d) { return d.race; });
        group = Patients.group("raceGroup", "race");
        $q.all([dimension, group]).then(function (things) {

            dc.pieChart("[ng-controller='race']")
                .width(210)
                .height(210)
                .dimension(things[0])
                .group(things[1])
                .innerRadius(25)
                .radius(100);
            dc.renderAll();

        });
    });

    app.controller("ethnicity", function ($scope, $q, dc, Patients) {
        var dimension, group;
        dimension = Patients.dimension("ethnicity", function (d) { return d.ethnicity; });
        group = Patients.group("ethnicityGroup", "ethnicity");
        $q.all([dimension, group]).then(function (things) {

            dc.pieChart("[ng-controller='ethnicity']")
                .width(210)
                .height(210)
                .dimension(things[0])
                .group(things[1])
                .innerRadius(25)
                .radius(100);
            dc.renderAll();

        });
    });

})();
