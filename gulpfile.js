"use strict";
var path = require("path");
var gulp = require("gulp");
var es = require("event-stream");
var clean = require("gulp-clean");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var merge = require('merge-stream');
var less = require("gulp-less");
var handlebars = require("gulp-handlebars");
var wrap = require("gulp-wrap");
var declare = require("gulp-declare");
var watch = require("gulp-watch");
var connect = require("gulp-connect");
var header = require("gulp-header");
var order = require("gulp-order");
var jshint = require("gulp-jshint");
var pkg = require("./package.json");
var print = require("gulp-print");
var mainBowerFiles = require("main-bower-files");

var banner = ["/**",
  " * <%= pkg.name %> - <%= pkg.description %>",
  " * @version v<%= pkg.version %>",
  " * @link <%= pkg.homepage %>",
  " * @license <%= pkg.license %>",
  " */",
  ""].join("\n");

/**
 * Clean ups ./dist folder
 */
gulp.task("clean", function() {
  return gulp
    .src("./dist", {read: false})
    .pipe(clean({force: true}))
    .on("error", log);
});

/**
 * JShint all *.js files
 */
gulp.task("lint", function () {
  return gulp.src("./src/main/javascript/**/*.js")
    .pipe(jshint())
    .pipe(jshint.reporter("jshint-stylish"));
});

/**
 * Build a distribution
 */
gulp.task("dist", ["clean"], _dist);
function _dist() {

    var partials = gulp.src(["./src/main/template/partials/*.handlebars"])
        .pipe(handlebars())
        .pipe(wrap("Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>));", {}, {
            imports: {
                processPartialName: function (fileName) {
                  
                    return JSON.stringify(path.basename(fileName, ".js"));
                }
            }
        }));

    partials.pipe(gulp.dest("src/main"));
    var templates = gulp.src(["./src/main/template/*.handlebars"])
        .pipe(handlebars())
        .pipe(wrap("Handlebars.template(<%= contents %>)"))
        .pipe(declare({
            namespace: "Handlebars.templates",
            noRedeclare: true
        }));

    var templatesFinal = merge(partials, templates);

    var scripts = gulp.src([
          "./src/main/javascript/**/*.js",
          "./node_modules/swagger-client/browser/swagger-client.js"
    ]);
    return merge(scripts, templatesFinal)
      .pipe(concat("swagger-ui.js"))
    
      
      .pipe(header(banner, { pkg: pkg }))
      .pipe(gulp.dest("./dist"))
      .pipe(uglify())
      .pipe(rename({ extname: ".min.js" }))      
      .pipe(gulp.dest("./dist"))
      .pipe(connect.reload());
}
gulp.task("dev-dist", ["lint", "dev-copy"], _dist);

/**
 * Processes less files into CSS files
 */
gulp.task("less", ["clean"], _less);
function _less() {
  return gulp
    .src([
      "./src/main/less/screen.less",
      "./src/main/less/print.less",
      "./src/main/less/reset.less",
      "./src/main/less/style.less"
    ])
    .pipe(less())
    .on("error", log)
    .pipe(gulp.dest("./src/main/html/css/"))
    .pipe(connect.reload());
}
gulp.task("dev-less", _less);

/**
 * Copy lib and html folders
 */
gulp.task("copy", ["less"], _copy);
function _copy() {

  // copy JavaScript files inside lib folder
  gulp
    .src(["./lib/**/*.{js,map}"])
    .pipe(gulp.dest("./dist/lib"))
    .on("error", log);

  // copy `lang` for translations
  gulp
    .src(["./lang/**/*.js"])
    .pipe(gulp.dest("./dist/lang"))
    .on("error", log);

  // copy all files inside html folder
  gulp
    .src(["./src/main/html/**/*"])
    .pipe(gulp.dest("./dist"))
    .on("error", log);
}
gulp.task("dev-copy", ["dev-less", "copy-local-specs"], _copy);

gulp.task("copy-local-specs", function () {
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

gulp.task("bower_files", ["clean"], _bower_files);
function _bower_files() {
    return gulp.src(mainBowerFiles())  
        .pipe(gulp.dest("dist/lib"));
};
function log(error) {
  console.error(error.toString && error.toString());
}

gulp.task("default", ["dist", "bower_files", "copy"]);
gulp.task("serve", ["connect", "watch"]);
gulp.task("dev", ["default"], function () {
     gulp.start("serve");
});
