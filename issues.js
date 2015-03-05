var github = require("octonode"),
    parse = require("parse-link-header"),
    util = require("util"),
    _ = require("underscore");

var client = github.client(process.env.TOKEN);

var countIssues = function (repo, issues) {
  var partition = _.partition(issues, function (issue) {
    return _.has(issue, "state") && (issue.state === "open");
  });

  var open = _.first(partition),
    closed = _.last(partition);

  console.log(util.format("REPO: %s\nTOTAL: %d\nOPEN: %d\nCLOSED: %d\n",
                         repo, issues.length, open.length, closed.length));
};

var allIssues = function (repo, page, issues, callback) {
  var ghrepo = client.repo(repo);

  ghrepo.issues({
    page: page,
    per_page: 100,
    state: "all",
  }, function (err, data, headers) {
    issues = issues.concat(data);

    if (_.has(headers, "link")) {
      var parsedLink = parse(headers.link);

      if (_.has(parsedLink, "next")) {
        if (_.has(parsedLink.next, "page")) {
          allIssues(repo, parsedLink.next.page, issues, callback);
        } else {
          callback(repo, issues);
        }
      } else{
        callback(repo, issues);
      }
    } else {
      callback(repo, issues);
    }
  });
};

allIssues("jquery/jquery", 0, [], countIssues);
