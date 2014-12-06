// gulpfile.js
var gulp = require('gulp');
var server = require('gulp-express');

gulp.task('server', function () {
  // Start the server at the beginning of the task
  server.run({
    file: './bin/www'
  });

  // Restart the server when file changes
  gulp.watch(['app.js', 'routes/**/*.js'], [server.run]);

});
