class PagesController < ApplicationController
  def dashboard
    render layout: "dashboard", locals: { presenter: graphtool_presenter }
  end
  
  def graphtool
    render layout: "graphtool", locals: { presenter: graphtool_presenter }
  end

  private

  def graphtool_presenter
    GraphtoolPresenter.new(configuration: current_configuration)
  end
end
