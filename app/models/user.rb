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
  before_validation :setup_defaul_environment, on: :create

  validates :configuration, presence: true
  validates :username, presence: true, uniqueness: true

  private

  def setup_defaul_environment
    self.configuration = build_configuration
    self.configuration.external_links = DefaultEnvironmentService.external_links
  end
end
