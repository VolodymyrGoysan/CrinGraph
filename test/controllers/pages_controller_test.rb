require "test_helper"

class PagesControllerTest < ActionDispatch::IntegrationTest
  test "should get graphtook" do
    get pages_graphtook_url
    assert_response :success
  end
end
