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

google_repos = client.org_repos 'google'

google_repos.each do |repo|
  full_name = repo[:full_name]
  languages = client.languages(full_name)
  most_used = most_used(languages)

  puts "#{full_name}: #{most_used}"  
end
