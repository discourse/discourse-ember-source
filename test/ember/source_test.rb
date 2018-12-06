require "test_helper"

class Ember::SourceTest < Minitest::Test
  def test_that_it_has_a_version_number
    refute_nil ::Ember::Source::VERSION
  end
end
