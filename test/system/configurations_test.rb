require "application_system_test_case"

class ConfigurationsTest < ApplicationSystemTestCase
  setup do
    @configuration = configurations(:one)
  end

  test "visiting the index" do
    visit configurations_url
    assert_selector "h1", text: "Configurations"
  end

  test "should create configuration" do
    visit configurations_url
    click_on "New configuration"

    click_on "Create Configuration"

    assert_text "Configuration was successfully created"
    click_on "Back"
  end

  test "should update Configuration" do
    visit configuration_url(@configuration)
    click_on "Edit this configuration", match: :first

    click_on "Update Configuration"

    assert_text "Configuration was successfully updated"
    click_on "Back"
  end

  test "should destroy Configuration" do
    visit configuration_url(@configuration)
    click_on "Destroy this configuration", match: :first

    assert_text "Configuration was successfully destroyed"
  end
end
