var github = require( "octonode" ),
    parse = require( "parse-link-header" ),
    util = require( "util" ),
    _ = require( "underscore" ),

    client = github.client( process.env.TOKEN ),

    countIssues = function( repo, issues ) {
      var open,
          closed,
          partition = _.partition( issues, function( issue ) {
        return _.has( issue, "state" ) && ( issue.state === "open" );
      } );

      open = _.first( partition ),
      closed = _.last( partition );

      console.log( util.format( "REPO: %s\nTOTAL: %d\nOPEN: %d\nCLOSED: %d\n",
                     repo, issues.length, open.length, closed.length ) );
    },

    allIssues = function( repo, page, issues, callback ) {
      var ghrepo = client.repo( repo );

      ghrepo.issues( {
        page: page,
        //jscs:disable requireCamelCaseOrUpperCaseIdentifiers
        per_page: 100,
        //jscs:enable requireCamelCaseOrUpperCaseIdentifiers
        state: "all"
      }, function( err, data, headers ) {
        issues = issues.concat( data );

        if ( _.has( headers, "link" ) ) {
          var parsedLink = parse( headers.link );

          if ( _.has( parsedLink, "next" ) ) {
            if ( _.has( parsedLink.next, "page" ) ) {
              allIssues( repo, parsedLink.next.page, issues, callback );
            } else {
              callback( repo, issues );
            }
          } else {
            callback( repo, issues );
          }
        } else {
          callback( repo, issues );
        }
      } );
    },

    parseRepos = function( org, repos ) {
      _.each( repos, function( repo ) {
        if ( _.has( repo, "name" ) ) {
          allIssues( org + "/" + repo.name, 0, [], countIssues );
        }
      } );
    },

    allRepos = function( org, page, repos, callback ) {
      var ghorg = client.org( org );

      ghorg.repos( {
        page: page,
        //jscs:disable requireCamelCaseOrUpperCaseIdentifiers
        per_page: 100
        //jscs:enable requireCamelCaseOrUpperCaseIdentifiers
      }, function( err, data, headers ) {
        repos = repos.concat( data );

        if ( _.has( headers, "link" ) ) {
          var parsedLink = parse( headers.link );

          if ( _.has( parsedLink, "next" ) ) {
            if ( _.has( parsedLink.next, "page" ) ) {
              allRepos( org, parsedLink.next.page, repos, callback );
            } else {
              callback( org, repos );
            }
          } else {
            callback( org, repos );
          }
        } else {
          callback( org, repos );
        }
      } );
    };

allRepos( "jquery", 0, [], parseRepos );
