wApps.manifest.apps.push({
    "name" : "TCGA Patients Dashboard",
    "url" : "http://drobbins.github.io/TCGA.patients/",
    "author" : "David Robbins",
    "namespace" : "tcgaptdb",
    "buildUI" : function (id) {
        this.require([
            "//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.2/jquery.min.js",
            "//cdnjs.cloudflare.com/ajax/libs/d3/3.1.6/d3.min.js",
            "//cdnjs.cloudflare.com/ajax/libs/crossfilter/1.1.3/crossfilter.min.js",
            "//cdnjs.cloudflare.com/ajax/libs/dc/1.3.0/dc.min.js",
            "//cdnjs.cloudflare.com/ajax/libs/angular.js/1.1.5/angular.min.js",
            "//cdnjs.cloudflare.com/ajax/libs/q.js/0.9.2/q.min.js",
            "https://hydrogen.path.uab.edu/ming/client.js",
            "http://localhost:8000/js/app.js"
        ], function () {
            tcgaptdb.buildUI(id);
        });
    }
});
