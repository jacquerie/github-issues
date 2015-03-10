var github = require( "octonode" ),
    moment = require( "moment" ),
    parse = require( "parse-link-header" ),
    _ = require( "underscore" ),

    client = github.client( process.env.TOKEN ),

    now = moment(),

    isOpen = function( issue ) {
      return _.has( issue, "state" ) && ( issue.state === "open" );
    },

    isPullRequest = function( issue ) {
      return _.has( issue, "pull_request" );
    },

    printJSON = _.compose( console.log,
      _.partial( JSON.stringify, _, null, 2 ) ),

    computeAge = function( now, issues ) {
      var seconds,
          min,
          avg,
          max;

      seconds = _.map( issues, function( issue ) {
        var result;

        if ( now ) {
          result = now.diff( moment( issue.created_at ) );
        } else {
          result = moment( issue.closed_at ).diff( moment( issue.created_at ) );
        }

        return result / 1000;
      } );

      min = _.min( seconds );
      avg = _.reduce( seconds, function( acc, second ) {
        return acc + second;
      }, 0 ) / seconds.length;
      max = _.max( seconds );

      return {
        min: Math.floor( min ),
        avg: Math.floor( avg ),
        max: Math.floor( max )
      };
    },

    printIssues = function( repo, issues ) {
      var open,
          openPulls,
          openIssues,
          closed,
          closedPulls,
          closedIssues,
          result,
          partition;

      partition = _.partition( issues, isOpen );
      open = _.first( partition );
      closed = _.last( partition );

      open = _.partition( open, isPullRequest );
      openPulls = _.first( open );
      openIssues = _.last( open );

      closed = _.partition( closed, isPullRequest );
      closedPulls = _.first( closed );
      closedIssues = _.last( closed );

      result = {
        repo: repo,
        total: issues.length,
        openPulls: openPulls.length,
        openPullsAge: computeAge( now, openPulls ),
        openIssues: openIssues.length,
        openIssuesAge: computeAge( now, openIssues ),
        closedPulls: closedPulls.length,
        closedPullsAge: computeAge( null, closedPulls ),
        closedIssues: closedIssues.length,
        closedIssuesAge: computeAge( null, closedIssues )
      };

      printJSON( result );
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
          allIssues( org + "/" + repo.name, 0, [], printIssues );
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
