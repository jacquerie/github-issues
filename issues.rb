require 'octokit'

def most_used(languages)
  languages
    .methods(false)
    .reject { |m| m.to_s.include?('=') || m.to_s.include?('?') }
    .max_by { |m| languages.send(m) }
    .to_s
end

# See: https://github.com/octokit/octokit.rb#using-a-netrc-file
client = Octokit::Client.new(:netrc => true)
client.login

# See: https://github.com/octokit/octokit.rb#auto-pagination
client.auto_paginate = true

org_name = ARGV.shift

begin
  repos = client.org_repos org_name
rescue
  puts "Usage: ruby issues.rb ORG_NAME"
  abort
end

repos.each do |repo|
  full_name = repo[:full_name]

  languages = client.languages(full_name)
  most_used = most_used(languages)

  issues = client.issues(full_name)

  if (issues.count > 0)
    puts "#{full_name}: (#{most_used})"
    issues.each do |issue|
      puts "\t#{issue.html_url}"
    end
  end
end
