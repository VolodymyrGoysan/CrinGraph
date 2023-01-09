class Unit < ApplicationRecord
  TYPES = %w[iem tws earphone headphone].freeze

  belongs_to :user
  has_many :variants, dependent: :destroy, inverse_of: :unit
  
  accepts_nested_attributes_for :variants, allow_destroy: true

  # TODO: get configuration channels length as value for validation
  validate :presence_of_default_variant
  validate :existance_only_of_one_default_variant

  validates :brand, presence: true
  
  validates :construction_type,
            presence: true,
            inclusion: { in: TYPES }
  
  validates :name,
            presence: true,
            uniqueness: { scope: :brand, case_sensitive: false }

  private

  def presence_of_default_variant
    return if variants.find(&:default).present?

    errors.add(:default_variant, "Must be at least one")
  end

  def existance_only_of_one_default_variant
    return if variants.size(&:default) <= 1

    errors.add(:variants, "Should be only one default")
  end
end
