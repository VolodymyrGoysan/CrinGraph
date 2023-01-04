class Configuration < ApplicationRecord
  CHANNELS = %w[L R].freeze
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

  validates :dual_channel, presence: true

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
  
  validates :alt_layout, presence: true

  validates :alt_sticky_graph, presence: true

  validates :alt_animated, presence: true

  validates :alt_header, presence: true

  validates :alt_header_new_tab, presence: true

  validates :alt_tutorial, presence: true

  validates :alt_augment, presence: true

  validates :share_url, presence: true

  validates :restricted, presence: true
  
  validates :expandable, presence: true

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
  
  validates :dark_mode_allowed, presence: true

  validates :dark_mode_enabled, presence: true
  
  # validates :target_color

  validates :target_dashed, presence: true

  validates :sticky_labels, presence: true

  validates :label_position,
            presence: true,
            inclusion: { in: LABEL_POSITIONS }
  
  validates :tone_generator_enabled, presence: true

  validates :analytics_enabled, presence: true

  validates :upload_fr_enabled, presence: true

  validates :upload_target_enabled, presence: true

  validates :eq_enabled, presence: true

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
