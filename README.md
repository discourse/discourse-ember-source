# discourse-ember-source

This is a fork of the gem which was before packaged into Ember https://github.com/emberjs/ember.js/tree/v2.18.2

## Versioning

This gem is using an unusual versioning: x.x.x.x. First 3 are the targeted Ember version, and last one is for modifications done
to the gem itself.


## Build

Change version in lib/ember/version.rb and then run `rake`

## Release

`gem build ember-source.gemspec`

`gem push discourse-ember-source-x.x.x.x.gem`
