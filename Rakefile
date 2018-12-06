require "bundler/gem_tasks"
require "rake/testtask"
require "fileutils"

require_relative "lib/ember/version"

Rake::TestTask.new(:test) do |t|
  t.libs << "test"
  t.libs << "lib"
  t.test_files = FileList["test/**/*_test.rb"]
end

task :default do
  ember_version = Ember::VERSION[/\d\.\d\.\d/]

  puts "Fetching Ember v#{ember_version}"

  FileUtils.rm_rf("ember")
  FileUtils.rm_rf("dist")

  `git clone -b 'v#{ember_version}' --single-branch --depth 1 https://github.com/emberjs/ember.js.git ember`
  `cd ember && yarn && yarn run build && cd -`


  FileUtils.mkdir_p("dist")
  FileUtils.cp_r("./ember/dist", "dist")
  # FileUtils.rm_rf("ember")
end
