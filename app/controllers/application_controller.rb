class ApplicationController < ActionController::Base
  helper_method :current_account
  helper_method :current_configuration

  def current_account
    @current_account ||= current_user || User.first
    # @current_account = User.first || User.new
  end

  def current_configuration
    @current_configuration ||= current_account.configuration || Configuration.new
  end
end
