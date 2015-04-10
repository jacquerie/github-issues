var issues = require( "./issues.js" ),
    nano = require( "nano" )( "http://localhost:5984" ),
    _ = require( "lodash" ),

    argument,

    db = nano.use( "repos" ),

    insert = function( repo ) {
      if ( _.has( repo, "name" ) ) {
        db.insert( repo, repo.name, function( err, body ) {
          if ( !err ) {
            console.log( body.id + " inserted." );
          }
        } );
      }
    };

if ( process.argv.length !== 3 ) {
  console.error( "Usage: node db.js (orgName|repoName)" );
} else {
  argument = process.argv[2];

  if ( argument.indexOf( "/" ) === -1 ) {
    issues.scanOrg( argument, insert );
  } else {
    issues.scanRepo( argument, insert );
  }
}
