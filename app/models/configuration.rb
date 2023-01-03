class Configuration < ApplicationRecord
  belongs_to :user
  has_many :external_links, dependent: :destroy, inverse_of: :configuration
  has_rich_text :accessories

  after_create :add_simple_description

  # watermark_image_url = "cringraph-logo.svg",   // Optional. If image file is in same directory as config, can be just the filename
  
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
