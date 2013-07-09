(function () {
    var app = angular.module("tcga-patient-dashboard", []);

 // Library Wrappers
    app.constant("d3", d3);
    app.constant("dc", dc);
    app.constant("ming", ming);
    app.constant("crossfilter", crossfilter);

    app.factory("MingDB", function (ming) {
        var database, endpoint, password, username;
        endpoint = "https://hydrogen.path.uab.edu/ming/server";
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

            group : function (groupName, dimensionName, reduceFunctions) {
                if (groups[groupName]) return $q.when(groups[groupName]);
                else {
                    var d = $q.defer();
                    groups[groupName] = d.promise;
                    return $q.all([filter, this.dimension(dimensionName)]).then(function (vals) {
                        var dimension = vals[1];
                        if (reduceFunctions) {
                            return dimension.group().reduce(reduceFunctions.add, reduceFunctions.remove, reduceFunctions.initial);
                        } else {
                            return dimension.group();
                        }
                    }).then(function (group) {
                        d.resolve(group);
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

    app.directive("piechart", function ($q, dc, Patients) {
        return {
            restrict : "E",
            scope : true,
            replace : true,
            link : function ($scope, $element, attributes) {
                var dimension, group, field;
                $scope.field = field = attributes.field;
                dimension = Patients.dimension(field, function (d) {return d[field];});
                group = Patients.group(field+"Group", field);
                $q.all([dimension, group]).then(function (things) {
                    dc.pieChart($element[0])
                        .width(210)
                        .height(210)
                        .dimension(things[0])
                        .group(things[1])
                        .innerRadius(25)
                        .radius(100);
                    dc.renderAll();
                    dc.redrawAll();
                });
            },
            template : "<div class=\"large-3 columns visualization\"><h5>{{field | uppercase}} <small class=\"filter\"></small></h5></div>"
        };
    });

    app.directive("barchart", function ($q, dc, Patients) {
        return {
            restrict : "E",
            scope : true,
            replace : true,
            link : function ($scope, $element, attributes) {
                var dimension, group, field, reductor, accessor;
                $scope.field = field = attributes.field;

                reductor = {
                    add : function reduceAdd(p, v) {
                      return v["_"+field] === 0 ? p : p + 1;
                    },

                    remove : function reduceRemove(p, v) {
                      return v["_"+field] === 0 ? p : p - 1;
                    },

                    initial : function reduceInitial() {
                      return 0;
                    }
                };

                dimension = Patients.dimension(field, function (d) {
                    var val = parseInt(d[field], 10);
                    d["_"+field] = isNaN(val) ? 0 : val;
                    return d["_"+field];
                });
                group = Patients.group(field+"Group", field, reductor);

                $q.all([dimension, group]).then(function (things) {
                    dc.barChart("div[field="+field+"]")
                        .width(475)
                        .height(210)
                        .dimension(things[0])
                        .group(things[1])
                        .x(d3.scale.linear().domain([things[0].bottom(1)["_"+field],things[0].top(1)["_"+field]]))
                        .elasticX(true)
                        .elasticY(true);
                    dc.renderAll();
                    dc.redrawAll();
                });
            },
            template : "<div class=\"large-6 columns visualization\"><h5>{{field | uppercase}} <small class=\"filter\"></small></h5></div>"
        };
    });

 })();

tcgaptdb = {};
tcgaptdb.buildUI = function (id) {
    var el = document.querySelector("#"+id);
    el.innerHTML = "<div>TCGA Patients</div><piechart field=\"gender\"></piechart><piechart field=\"vital_status\"></piechart>";
    angular.bootstrap(el, ["tcga-patient-dashboard"]);
};
