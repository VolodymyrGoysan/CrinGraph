# frozen_string_literal: true

class GraphtoolPresenter < BasePresenter
  include Serializable

  attribute(:configuration)
  serializable_object(:configuration)
  serializable_attributes(:config, :external_links)

  def config
    ConfigurationPresenter.new(configuration:).serialize
  end
  
  def external_links
    configuration
      .external_links
      .select(:id, :name, :group, :url)
      .map(&:as_json)
  end
end
