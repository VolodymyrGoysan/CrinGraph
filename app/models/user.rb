class User < ApplicationRecord
  # :omniauthable
  devise(
    :confirmable,
    :database_authenticatable,
    :trackable,
    :lockable,
    :registerable,
    :recoverable,
    :rememberable,
    :validatable,
    :timeoutable,
  )

  has_one :configuration, dependent: :destroy, inverse_of: :user
  has_many :units, dependent: :destroy, inverse_of: :user

  before_validation :setup_defaul_environment, on: :create

  validates :configuration, presence: true
  validates :username, presence: true, uniqueness: true

  delegate :external_links, to: :configuration

  private

  def setup_defaul_environment
    self.configuration = Configuration.new(configuration_params)
    self.configuration.external_links = DefaultEnvironmentService.external_links
  end

  def configuration_params
    {
      alt_layout: true,
      alt_sticky_graph: true,
      alt_animated: true,
      alt_header: true,
      alt_header_new_tab: true,
      alt_tutorial: true,
      alt_augment: true
    }
  end
end
