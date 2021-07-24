'use strict';

const gulp = require('gulp'),
  gulpif = require('gulp-if'),
  uglify = require('gulp-uglify'),
  del = require('del'),
  data = require('gulp-data'),
  sass = require('gulp-sass'),
  imagemin = require('gulp-imagemin'),
  concat = require('gulp-concat'),
  fs = require('fs'),
  autoprefixer = require('gulp-autoprefixer'),
  browserSync = require('browser-sync').create(),
  postcss = require('gulp-postcss'),
  nunjucksRender = require('gulp-nunjucks-render');

const autoprefixList = ['last 2 versions', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'];
// Local
const packageJson = require("./package.json");

const basePath = {
  src: 'src/',
  dest: 'public/'
};

let isProd = false;

function swallowError(error) {

  // If you want details of the error in the console
  console.log(error.toString())

  this.emit('end')
}

const srcAssets = {
  styles: basePath.src + 'css/',
  scripts: basePath.src + 'js/',
  files: basePath.src + 'files/',
  images: basePath.src + 'images/',
  modules: 'node_modules/',
  views: basePath.src + 'template/',
  root: basePath.src
};

const destAssets = {
  styles: basePath.dest + 'css/',
  files: basePath.dest + 'files/',
  scripts: basePath.dest + 'js/',
  images: basePath.dest + 'images/',
  root: basePath.dest
};

const scriptFiles = [
  // srcAssets.modules + 'jquery/dist/jquery.js',
  srcAssets.scripts + '**/*.+(js)'
]

gulp.task('set-prod', function () {
  console.log('############ =========> Building files for Production');
  isProd = true;
});

gulp.task('styles', function () {
  gulp.src(srcAssets.styles + 'main.scss')
    .pipe(sass({
      sourceComments: 'map',
      sourceMap: 'sass',
      outputStyle: 'nested'
    }))
    .pipe(gulpif(isProd, sass({
      outputStyle: 'compressed'
    })))
    .pipe(autoprefixer({ overrideBrowserlist: autoprefixList }))
    .pipe(gulp.dest(destAssets.styles))
    .pipe(browserSync.reload({
      stream: true
    }))
});

gulp.task('scripts', function () {
  gulp.src(scriptFiles)
    .pipe(concat('main.js'))
    .pipe(gulpif(isProd, uglify()))
    .pipe(gulp.dest(destAssets.scripts));

});

gulp.task('images', function () {
  return gulp.src(srcAssets.images + '**/*.+(png|jpg|gif|svg)')
    .pipe(gulpif(isProd, imagemin({
      interlaced: true
    })))
    .pipe(gulp.dest(destAssets.images))
});

gulp.task('clean', function () {
  return del.sync(destAssets.root);
});

gulp.task('browserSync', function () {
  browserSync.init({
    server: {
      baseDir: destAssets.root
    },
  })
});

gulp.task('copy', function () {
  return gulp.src([srcAssets.images + '**/*.+(png|jpg|gif|svg)', srcAssets.files + '**/*'], { base: srcAssets.root })
    .pipe(gulp.dest(destAssets.root))
});

gulp.task('template', function () {
  return gulp.src(srcAssets.root + 'template/pages/**/*.+(html|nunjucks|njk)')
    .pipe(data(function (file) {
      return JSON.parse(fs.readFileSync('./data.json'));
    }))
    .pipe(nunjucksRender({
      // path: [srcAssets.root + 'template/']
      path: srcAssets.views,
      data: {
        isProd,
        version: packageJson.version,
        paths: {
          root: isProd ? "." : ".",
          scripts: '/js',
          styles: '/css',
          files: '/files',
          images: '/images',
        },
      }
    }))
    .on('error', swallowError)
    .pipe(gulp.dest(destAssets.root))
});

gulp.task('watch', ['copy', 'styles', 'scripts', 'template', 'browserSync'], function () {
  gulp.watch(srcAssets.images + '**/*.+(png|jpg|gif|svg)', ['copy']);
  gulp.watch(srcAssets.styles + '**/*.+(scss|sass|css)', ['styles']);
  gulp.watch(srcAssets.scripts + '**/*.js', ['scripts', browserSync.reload]);
  gulp.watch(srcAssets.root + '**/*.+(html|nunjucks|njk)', ['template', browserSync.reload]);
  gulp.watch('navigation.json', ['template', browserSync.reload]);
});

gulp.task('default', ['clean', 'images', 'styles', 'scripts', 'template', 'watch'], function () {
  console.log('############ =========> Development');
});

gulp.task('build', ['default']);

gulp.task('production', ['set-prod', 'clean', 'images', 'styles', 'scripts', 'template']);