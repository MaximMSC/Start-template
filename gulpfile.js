'use string';

const autoprefixer = require('gulp-autoprefixer'),
    browserSync = require('browser-sync').create(),
    cache = require('gulp-cache'),
    cheerio = require('gulp-cheerio'),
    csso = require('gulp-csso'),
    csscomb = require('gulp-csscomb'),
    cached = require('gulp-cached'),
    concat = require('gulp-concat'),
    del = require('del'),
    filter = require('gulp-filter');
    gulp = require('gulp'),
    gulpif = require('gulp-if'),
    imagemin = require('gulp-imagemin'),
    imageminMozjpeg = require('imagemin-mozjpeg'),
    plumber = require('gulp-plumber'),
    pug = require('gulp-pug'),
    rename = require('gulp-rename'),
    replace = require('gulp-replace'),
    sourcemaps = require('gulp-sourcemaps'),
    scss = require('gulp-sass'),
    svgSprite = require('gulp-svg-sprite'),
	svgmin = require('gulp-svgmin'),
    uglify = require('gulp-uglify');
    

gulp.task('pug', function(){
    return gulp.src('./dev/pug/**/*.pug')
    .pipe(plumber())
    .pipe(pug({
        pretty: true
    }))
    .pipe(plumber.stop())
    .pipe(cached('pug'))
    .pipe(gulp.dest('./build'))
    .on('end', browserSync.reload);
});

gulp.task('scss:dev', function (){
    return gulp.src('./dev/static/styles/styles.scss')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(scss())
    .pipe(autoprefixer({
        overrideBrowserslist: ['last 3 versions']
    }))
    .pipe(sourcemaps.write())
    .pipe(rename('styles.min.css'))
    .pipe(gulp.dest('./build/static/css'))
    .on('end', browserSync.reload);
});

gulp.task('scss:build', function (){
    return gulp.src('./dev/static/styles/styles.scss')
    .pipe(scss())
    .pipe(autoprefixer({
        overrideBrowserslist: ['last 3 versions']
    }))
    .pipe(csscomb())
    .pipe(gulp.dest('./build/static/css'))
});

gulp.task('scss:build-min', function (){
    return gulp.src('./dev/static/styles/styles.scss')
    .pipe(scss())
    .pipe(autoprefixer())
    .pipe(csscomb())
    .pipe(csso())
    .pipe(rename('styles.min.css'))
    .pipe(gulp.dest('./build/static/css'))
});

gulp.task('libsJS:dev', function (){
    return gulp.src(['node_modules/svg4everybody/dist/svg4everybody.min.js'])
    .pipe(concat('libs.min.js'))
    .pipe(gulp.dest('./build/static/js/'))
})

gulp.task('libsJS:build', function (){
    return gulp.src(['node_modules/svg4everybody/dist/svg4everybody.min.js'])
    .pipe(concat('libs.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./build/static/js/'))
})

gulp.task('js:dev', function (){
    return gulp.src('./dev/static/js/**/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('./build/static/js/'))
    .pipe(browserSync.reload({
        stream: true
    }));
})

gulp.task('img:dev', function (){
    return gulp.src(["./dev/static/images/**/*.{png,jpg,gif,svg}",
    '!./dev/static/images/svg/*'])
    .pipe(gulp.dest('./build/static/images/'))
});


gulp.task('img:build', function (){
    return gulp.src(["./dev/static/images/**/*.{png,jpg,gif,svg}",
    '!./dev/static/images/svg/*'])
    .pipe(cache(imagemin([
        imageminMozjpeg({
        quality: 85
        }),
        imagemin.gifsicle(),
        imagemin.optipng(),
        imagemin.svgo()
    ])))
    .pipe(gulp.dest('./build/static/images/'))
});

gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./build"
        }
    });
});

gulp.task('svg', function(){
    return gulp.src('./dev/static/images/svg/*.svg')
    .pipe(svgmin({
        js2svg: {
            pretty: true
        }
    }))
    // remove all fill and style declarations in out shapes
    .pipe(cheerio({
        run: function ($) {
            $('[fill]').removeAttr('fill');
            $('[style]').removeAttr('style');
        },
        parserOptions: { xmlMode: true }
    }))
    // cheerio plugin create unnecessary string '>', so replace it.
    .pipe(replace('&gt;', '>'))
    // build svg sprite
    .pipe(svgSprite({
        mode: {
            symbol: {
                sprite: "sprite.svg"
            }
        }
    }))
    .pipe(gulp.dest('./build/static/images/svg/'))
})

gulp.task('fonts', function (){
    return gulp.src('./dev/static/fonts/**/*.*')
    .pipe(gulp.dest('./build/static/fonts/'))
    .on('end', browserSync.reload);
});

gulp.task('clean', function (){
    return del('./build');
})

gulp.task('watch', function(){
    gulp.watch('./dev/pug/**/*.pug', gulp.series('pug'))
    gulp.watch('./dev/static/styles/**/*.scss', gulp.series('scss:dev'));
    gulp.watch(['./dev/static/images/general/**/*.{png,jpg,gif,svg}',
            './dev/static/images/content/**/*.{png,jpg,gif,svg}'], gulp.series('img:dev'));
    gulp.watch('./dev/static/images/svg/*.svg', gulp.series('svg'));
    gulp.watch('./dev/static/js/**/*.js', gulp.series('js:dev'));
});

gulp.task('dev', gulp.series(
    'clean', gulp.parallel('pug', 'fonts', 'scss:dev', 'libsJS:dev', 'js:dev', 'img:dev','svg')
));

gulp.task('build', gulp.series(
    'clean',
    gulp.parallel(
        'pug',
        'fonts',
        'scss:build',
        'libsJS:build',
        'img:build',
        'svg'
    )
));



gulp.task('default', gulp.series(
    'dev',
    gulp.parallel('watch','browser-sync')
));