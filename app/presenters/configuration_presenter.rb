# frozen_string_literal: true

class ConfigurationPresenter < BasePresenter
  include Serializable
  include ActionText::ContentHelper

  attribute(:configuration)
  serializable_object(:configuration)
  serializable_attributes(
    :watermark_text,
    :page_title,
    :page_description,
    :dual_channel,
    :enabled_channel,
    :notmalization_type,
    :normalization_db,
    :normalization_hz,
    :max_channel_imbalance,
    :alt_layout,
    :alt_sticky_graph,
    :alt_animated,
    :alt_header,
    :alt_header_new_tab,
    :alt_tutorial,
    :alt_augment,
    :share_url,
    :restricted,
    :expandable,
    :expandable_width,
    :expandable_header_height,
    :dark_mode_allowed,
    :dark_mode_enabled,
    :target_color,
    :target_dashed,
    :sticky_labels,
    :label_position,
    :tone_generator_enabled,
    :analytics_enabled,
    :upload_fr_enabled,
    :upload_target_enabled,
    :eq_enabled,
    :eq_bands_default,
    :eq_bands_max,
    :accessories
  )

  def accessories
    return if configuration.accessories.blank?

    ActionText::Content
      .new(configuration.accessories.body.to_html)
      .to_s
  end
end