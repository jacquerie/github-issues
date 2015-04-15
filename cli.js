var issues = require( "./issues.js" ),
    _ = require( "lodash" ),

    argument,

    printJSON = _.compose( console.log,
      _.partial( JSON.stringify, _, null, 2 ) );

if ( process.argv.length !== 3 ) {
  console.error( "Usage: node cli.js (orgName|repoName)" );
} else {
  argument = process.argv[2];

  if ( argument.indexOf( "/" ) === -1 ) {
    issues.walkOrg( argument, printJSON );
  } else {
    issues.walkRepo( argument, printJSON );
  }
}
