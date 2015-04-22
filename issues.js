var github = require( "octonode" ),
    moment = require( "moment" ),
    parse = require( "parse-link-header" ),
    _ = require( "lodash" ),

    client = github.client( process.env.TOKEN ),

    now = moment(),

    isOpen = function( issue ) {
      return _.has( issue, "state" ) && ( issue.state === "open" );
    },

    isPullRequest = function( issue ) {
      return _.has( issue, "pull_request" );
    },

    wasCreated = function( issue ) {
      return _.has( issue, "created_at" );
    },

    wasClosed = function( issue ) {
      return _.has( issue, "closed_at" ) && _.has( issue, "created_at" );
    },

    hasName = function( repo ) {
      return _.has( repo, "name" );
    },

    hasLink = function( headers ) {
      return _.has( headers, "link" );
    },

    hasNext = function( link ) {
      return _.has( link, "next" );
    },

    hasPage = function( next ) {
      return _.has( next, "page" );
    },

    computeAge = function( now, issues ) {
      var seconds,
          min,
          avg,
          max;

      seconds = _.map( issues, function( issue ) {
        var result = 0;

        if ( now ) {
          if ( wasCreated( issue ) ) {
            /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
            result = now.diff( moment( issue.created_at ) );
            /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
          }
        } else {
          if ( wasClosed( issue ) ) {
            /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
            result = moment( issue.closed_at ).diff( moment( issue.created_at ) );
            /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
          }
        }

        return result / 1000;
      } );

      min = _.min( seconds );
      avg = _.reduce( seconds, _.add, 0 ) / seconds.length;
      max = _.max( seconds );

      return {
        min: Math.floor( min ),
        avg: Math.floor( avg ),
        max: Math.floor( max )
      };
    },

    parseIssues = function( repo, issues, behavior ) {
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
        name: repo,
        issues: {
          open: {
            count: openIssues.length,
            age: computeAge( now, openIssues )
          },
          closed: {
            count: closedIssues.length,
            age: computeAge( null, closedIssues )
          }
        },
        pulls: {
          open: {
            count: openPulls.length,
            age: computeAge( now, openPulls )
          },
          closed: {
            count: closedPulls.length,
            age: computeAge( null, closedPulls )
          }
        }
      };

      behavior( result );
    },

    allIssues = function( repo, page, issues, continuation, behavior ) {
      var ghrepo = client.repo( repo );

      ghrepo.issues( {
        page: page,
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        per_page: 100,
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        state: "all"
      }, function( err, data, headers ) {
        issues = issues.concat( data );

        if ( hasLink( headers ) ) {
          var parsedLink = parse( headers.link );

          if ( hasNext( parsedLink ) ) {
            if ( hasPage( parsedLink.next ) ) {
              allIssues( repo, parsedLink.next.page, issues, continuation, behavior );
            } else {
              continuation( repo, issues, behavior );
            }
          } else {
            continuation( repo, issues, behavior );
          }
        } else {
          continuation( repo, issues, behavior );
        }
      } );
    },

    parseRepos = function( org, repos, continuation, behavior ) {
      _.each( repos, function( repo ) {
        if ( hasName( repo ) ) {
          continuation( org + "/" + repo.name, 0, [], parseIssues, behavior );
        }
      } );
    },

    allRepos = function( org, page, repos, continuation, behavior ) {
      var ghorg = client.org( org );

      ghorg.repos( {
        page: page,
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        per_page: 100
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      }, function( err, data, headers ) {
        repos = repos.concat( data );

        if ( hasLink( headers ) ) {
          var parsedLink = parse( headers.link );

          if ( hasNext( parsedLink ) ) {
            if ( hasPage( parsedLink.next ) ) {
              allRepos( org, parsedLink.next.page, repos, continuation, behavior );
            } else {
              continuation( org, repos, allIssues, behavior );
            }
          } else {
            continuation( org, repos, allIssues, behavior );
          }
        } else {
          continuation( org, repos, allIssues, behavior );
        }
      } );
    };

module.exports = {
  walkOrg: function( org, behavior ) {
    allRepos( org, 0, [], parseRepos, behavior );
  },
  walkRepo: function( repo, behavior ) {
    allIssues( repo, 0, [], parseIssues, behavior );
  }
};
