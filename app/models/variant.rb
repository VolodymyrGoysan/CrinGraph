class Variant < ApplicationRecord
  CHANNELS = %w[L R].freeze

  belongs_to :unit
  has_one_attached :file

  before_validation :parse_file_data

  validates :fr_data,
            presence: true,
            allow_blank: false

  validates :file,
            attached: true,
            size: { between: 100.bytes..1.megabyte },
            content_type: { in: %w[csv txt] }

  validates :name,
            presence: true,
            unless: :default

  validates :default,
            presence: true,
            inclusion: { in: [true, false] }

  validates :channel,
            presence: true,
            inclusion: { in: CHANNELS },
            uniqueness: { scope: [:unit, :name] }

  private

  # TODO: move it to separate class
  def parse_file_data
    data = []
    
    attachment_changes['file']
      .attachable
      .open
      .read
      .split(/[\r\n]/)
      .each do |row|
        next if row.starts_with?('*')

        data << row.scan(/[+-]?\d+(?:\.\d+)?/)[0...2].map(&:to_f)
      end

    self.fr_data = data
  end
end
