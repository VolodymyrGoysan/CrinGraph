class ExternalLink < ApplicationRecord
	belongs_to :configuration

	validates :group,
						presence: true,
						length: { maximum: 255 }

	validates :name,
						presence: true,
						length: { maximum: 255 }

	validates :url,
						presence: true,
						length: { maximum: 255 }
end
