/* eslint-env node */
const gulp = require('gulp');
const resize = require('gulp-image-resize');
const rename = require('gulp-rename');

gulp.task('images', ['img-small', 'img-medium', 'img-large']);

gulp.task('img-small', function () {
    return gulp.src('./img/*.jpg')
        .pipe(resize({
            width: 320,
            height: 280,
            crop: true,
            upscale: false,
            quality: 0.5,
            progressive: true,
            withMetadata: false
        }))
        .pipe(rename({suffix: '_small', extname: '.jpg'}))
        .pipe(gulp.dest('./destImg'));
});

gulp.task('img-medium', function () {
    return gulp.src('./img/*.jpg')
        .pipe(resize({
            width: 480,
            height: 440,
            crop: true,
            upscale: false,
            quality: 0.5,
            progressive: true,
            withMetadata: false
        }))
        .pipe(rename({suffix: '_medium', extname: '.jpg'}))
        .pipe(gulp.dest('./destImg'));
});

gulp.task('img-large', function () {
    return gulp.src('./img/*.jpg')
        .pipe(resize({
            width: 800,
            height: 600,
            crop: true,
            upscale: false,
            quality: 0.5,
            progressive: true,
            withMetadata: false
        }))
        .pipe(rename({suffix: '_large', extname: '.jpg'}))
        .pipe(gulp.dest('./destImg'));
});
