class PagesController < ApplicationController
  def dashboard
    render layout: "dashboard"
  end
  
  def graphtool
    render layout: "graphtool"
  end
end
