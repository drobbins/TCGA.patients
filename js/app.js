(function () {
    var app = angular.module("tcga-patient-dashboard", []);

 // Library Wrappers
    app.constant("d3", d3);
    app.constant("dc", dc);
    app.constant("ming", ming);
    app.constant("crossfilter", crossfilter);

    app.factory("Fields", function () {
    });
})();
