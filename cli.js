var issues = require( "./issues.js" ),

    argument;

if ( process.argv.length !== 3 ) {
  console.error( "Usage: node cli.js (orgName|repoName)" );
} else {
  argument = process.argv[2];

  if ( argument.indexOf( "/" ) === -1 ) {
    issues.allRepos( argument, 0, [], issues.parseRepos );
  } else {
    issues.allIssues( argument, 0, [], issues.parseIssues );
  }
}
