lib = File.expand_path("../lib", __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require "ember/version"

Gem::Specification.new do |spec|
  spec.name          = "discourse-ember-source"
  spec.version       = Ember::VERSION
  spec.authors       = ["Joffrey JAFFEUX"]
  spec.email         = ["j.jaffeux@gmail.com"]

  spec.summary       = %q{Fork of Ember source}
  spec.description   = %q{Fork of Ember source to permit latest ember versions}
  spec.homepage      = "https://github.com/discourse/discourse-ember-source"
  spec.license       = "MIT"

  spec.files         = Dir['lib/ember/*.rb', 'dist/*.js', 'dist/*.map']

  spec.bindir        = "exe"
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", ">= 1.16"
  spec.add_development_dependency "rake", "~> 13.0"
  spec.add_development_dependency "minitest", "~> 5.0"
end
