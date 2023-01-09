class ApplicationController < ActionController::Base
  before_action :load_current_account
  before_action :load_current_configuration

  private

  def load_current_account
    @current_account = current_user
    # @current_account = User.first || User.new
  end

  def load_current_configuration
    @current_configuration = @current_account.configuration || Configuration.new
  end
end
