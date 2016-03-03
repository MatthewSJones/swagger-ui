"use strict";
var gulp = require("gulp");
var path = require("path");
var clean = require("gulp-clean");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var handlebars = require("gulp-handlebars");
var mainBowerFiles = require("main-bower-files");
var jshint = require("gulp-jshint");
var rename = require("gulp-rename");
var merge = require("merge-stream");
var less = require("gulp-less");
var wrap = require("gulp-wrap");
var declare = require("gulp-declare");
var watch = require("gulp-watch");
var connect = require("gulp-connect");
var header = require("gulp-header");
var pkg = require("./package.json");
var print = require("gulp-print");

var basePath = {
    src: "./src/main/",
    dest: "./dist/",
    swaggerClient: "./node_modules/swagger-client/browser/"
};

var srcAssets = {
    html: basePath.src + "html/",
    less: basePath.src + "less/",
    scripts: basePath.src + "javascript/",
    templates: basePath.src + "template/",
    css: basePath.src + "html/css/"
};

var destAssets = {
    styles: basePath.dest + "stylesheets/",
    scripts: basePath.dest + "lib/",
    specs: basePath.dest + "specs/"
};

var banner = [
    "/**",
    " * <%= pkg.name %> - <%= pkg.description %>",
    " * @version v<%= pkg.version %>",
    " * @link <%= pkg.homepage %>",
    " * @license <%= pkg.license %>",
    " */",
    ""
].join("\n");

/**
 * Clean ups distribution folder
 */
gulp.task("clean", function() {
    return gulp
        .src(basePath.dest, { read: false })
        .pipe(clean({ force: true }))
        .on("error", log);
});

/**
 * JShint all *.js files
 */
gulp.task("lint", function() {
    return gulp.src(srcAssets.scripts + "**/*.js")
        .pipe(jshint())
        .pipe(jshint.reporter("jshint-stylish"));
});

/**
 * Build a distribution
 */
gulp.task("dist", ["clean"], _dist);

function _dist() {

    //Handlebar partial templates
    var partials = gulp.src([srcAssets.templates + "partials/*.handlebars"])
        .pipe(handlebars())
        .pipe(wrap("Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>));", {}, {
            imports: {
                processPartialName: function(fileName) {
                    return JSON.stringify(path.basename(fileName, ".js"));
                }
            }
        }));

    //Handlebar main templates
    var templates = gulp.src([srcAssets.templates + "*.handlebars"])
        .pipe(handlebars())
        .pipe(wrap("Handlebars.template(<%= contents %>)"))
        .pipe(declare({
            namespace: "Handlebars.templates",
            noRedeclare: true
        }));

    var merged = merge(partials, templates);
    var swaggerAddOns = gulp.src([
       basePath.swaggerClient + "swagger-client.js"
    ]);

    merged.add(swaggerAddOns);

    merged.add(gulp.src([srcAssets.scripts + "**/*.js"]));

    var scripts = gulp.src([      
        srcAssets.html + "jwt-auth.js",
        srcAssets.html + "swagger-ui-init.js"
    ]);

   
    return merge(merged, scripts)
        .pipe(concat("swagger-ui.js"))
        //make non-minified version
        .pipe(header(banner, { pkg: pkg }))
        .pipe(gulp.dest(basePath.dest))
        //make minified version
        .pipe(uglify())
        .pipe(rename({ extname: ".min.js" }))
        .pipe(gulp.dest(basePath.dest))
        .pipe(connect.reload());
}

gulp.task("bower_files", ["clean"], _bower_files);

/**
 * Concate and move bower files to distribution folder
 */
function _bower_files() {
    return gulp.src(mainBowerFiles())
       // .pipe(uglify()).on("error", log)
        .pipe(concat("all.min.js"))
        .pipe(gulp.dest("dist/lib"));
};

gulp.task("dev-dist", ["lint", "dev-copy"], _dist);

/**
 * Processes less files into CSS files
 */
gulp.task("less", ["clean"], _less);

function _less() {
    return gulp
        .src([
            srcAssets.less + "screen.less",
            srcAssets.less + "print.less",
            srcAssets.less + "reset.less",
            srcAssets.less + "style.less"
        ])
        .pipe(less())
        .on("error", log)
        .pipe(gulp.dest(srcAssets.css))
        .pipe(connect.reload());
}

gulp.task("dev-less", _less);

/**
 * Copy lib and html folders
 */
gulp.task("copy", ["clean","less"], _copy);

function _copy() {

    // copy JavaScript files inside lib folder
    gulp
        .src(["./lib/**/*.{js,map}"])       
        .pipe(uglify()).on("error", log)
        .pipe(gulp.dest("dist/lib"))
        .on("error", log);

    // copy `lang` for translations
    gulp
        .src(["./lang/**/*.js"])
        .pipe(gulp.dest("./dist/lang"))
        .on("error", log);

    // copy all files inside html folder
    gulp
        .src(["./src/main/html/**/*"])
        .pipe(gulp.dest(basePath.dest))
        .on("error", log);
}

gulp.task("dev-copy", ["dev-less", "copy-local-specs"], _copy);

gulp.task("copy-local-specs",["clean"], function () {
    // copy the test specs
    return gulp
        .src(["./test/specs/**/*"])
        .pipe(gulp.dest("./dist/specs"))
        .on("error", log);
});

/**
 * Watch for changes and recompile
 */
gulp.task("watch", ["copy-local-specs"], function() {
    return watch([
            "./src/**/*.{js,less,handlebars}",
            "./src/main/html/*.html",
            "./test/specs/**/*.{json,yaml}"
        ],
        function() {
            gulp.start("dev-dist");
        });
});

/**
 * Live reload web server of `dist`
 */
gulp.task("connect", function() {
    connect.server({
        root: "dist",
        livereload: true
    });
});

function log(error) {
    console.error(error.toString && error.toString());
}

gulp.task("default", ["dist", "bower_files", "copy-local-specs", "copy"]);
gulp.task("serve", ["connect", "watch"]);
gulp.task("dev", ["default"], function() {
    gulp.start("serve");
});