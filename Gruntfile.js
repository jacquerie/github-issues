module.exports = function( grunt ) {
  grunt.initConfig( {
    jscs: {
      all: {
        src: [ "cli.js", "db.js", "Gruntfile.js", "issues.js" ]
      }
    },
    jshint: {
      all: {
        src: [ "cli.js", "db.js", "Gruntfile.js", "issues.js" ],
        options: {
          jshintrc: true
        }
      }
    },
    jsonlint: {
      pkg: {
        src: [ "package.json" ]
      }
    }
  } );

  require( "load-grunt-tasks" )( grunt );

  grunt.registerTask( "default", [ "jsonlint", "jshint", "jscs" ] );
};
