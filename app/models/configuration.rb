class Configuration < ApplicationRecord
  CHANNELS = %w[L R].freeze
  BOOLEAN_TYPES = [true, false]
  NORMALIZATION_TYPES = %w[dB Hz].freeze
  LABEL_POSITIONS = [
    "default", "top-left", "bottom-left", "bottom-right"
  ].freeze

  belongs_to :user
  has_many :external_links, dependent: :destroy, inverse_of: :configuration
  has_rich_text :accessories

  validates :watermark_text,
            length: { maximum: 255 },
            allow_blank: true

  validates :page_title,
            length: { maximum: 255 },
            allow_blank: true

  validates :page_description,
            length: { maximum: 10_000 },
            allow_blank: true

  validates :dual_channel,
            inclusion: { in: BOOLEAN_TYPES }

  validates :enabled_channel,
            presence: true,
            inclusion: { in: CHANNELS }

  validates :notmalization_type,
            presence: true,
            inclusion: { in: NORMALIZATION_TYPES }

  validates :normalization_db,
            presence: true,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 20,
              less_than_or_equal_to: 150
            }

  validates :normalization_hz,
            presence: true,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 20,
              less_than_or_equal_to: 20_000
            }

  validates :max_channel_imbalance, presence: true
  
  validates :alt_layout,
            inclusion: { in: BOOLEAN_TYPES }

  validates :alt_sticky_graph,
            inclusion: { in: BOOLEAN_TYPES }

  validates :alt_animated,
            inclusion: { in: BOOLEAN_TYPES }

  validates :alt_header,
            inclusion: { in: BOOLEAN_TYPES }

  validates :alt_header_new_tab,
            inclusion: { in: BOOLEAN_TYPES }

  validates :alt_tutorial,
            inclusion: { in: BOOLEAN_TYPES }

  validates :alt_augment,
            inclusion: { in: BOOLEAN_TYPES }

  validates :share_url,
            inclusion: { in: BOOLEAN_TYPES }

  validates :restricted,
            inclusion: { in: BOOLEAN_TYPES }
  
  validates :expandable,
            inclusion: { in: BOOLEAN_TYPES }

  validates :expandable_width,
            presence: true,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 0,
              less_than_or_equal_to: 100_000
            }

  validates :expandable_header_height,
            presence: true,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 0,
              less_than_or_equal_to: 100_000
            }
  
  validates :dark_mode_allowed,
            inclusion: { in: BOOLEAN_TYPES }

  validates :dark_mode_enabled,
            inclusion: { in: BOOLEAN_TYPES }
  
  validates :target_color,
            length: { in: 0..255 }

  validates :target_dashed,
            inclusion: { in: BOOLEAN_TYPES }

  validates :sticky_labels,
            inclusion: { in: BOOLEAN_TYPES }

  validates :label_position,
            presence: true,
            inclusion: { in: LABEL_POSITIONS }
  
  validates :tone_generator_enabled,
            inclusion: { in: BOOLEAN_TYPES }

  validates :analytics_enabled,
            inclusion: { in: BOOLEAN_TYPES }

  validates :upload_fr_enabled,
            inclusion: { in: BOOLEAN_TYPES }

  validates :upload_target_enabled,
            inclusion: { in: BOOLEAN_TYPES }

  validates :eq_enabled,
            inclusion: { in: BOOLEAN_TYPES }

  validates :eq_bands_default,
            presence: true,
            numericality: {
              only_integer: true,
              greater_than: 0,
              less_than_or_equal_to: 100
            }

  validates :eq_bands_max,
            presence: true,
            numericality: {
              only_integer: true,
              greater_than: 0,
              less_than_or_equal_to: 100
            }

  after_create :add_simple_description

  # TODO: add watermark_image upload
  
  private

  def add_simple_description
    self.accessories = <<~EOS
      <p class="center">
        This web software is based on the
        <a href="https://github.com/mlochbaum/CrinGraph">CrinGraph</a>
        open source software project.
      </p>
    EOS
  end
end
