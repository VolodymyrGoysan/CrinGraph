class ConfigurationsController < ApplicationController
  before_action :authenticate_user!

  def show
    @configuration = current_user.configuration
  end

  def edit
    @configuration = current_user.configuration
  end

  def update
    @configuration = current_user.configuration

    respond_to do |format|
      if @configuration.update(configuration_params)
        format.html { redirect_to root_path, notice: "Configuration was successfully updated." }
        format.json { render :show, status: :ok, location: @configuration }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @configuration.errors, status: :unprocessable_entity }
      end
    end
  end

  private
    
  def configuration_params
    params
      .fetch(:configuration, {})
      .permit(
        :id, :user_id, :watermark_text, :page_title, :page_description,
        :dual_channel, :enabled_channel, :notmalization_type, :normalization_db,
        :normalization_hz, :max_channel_imbalance, :alt_layout, :accessories,
        :alt_sticky_graph, :alt_animated, :alt_header, :alt_header_new_tab,
        :alt_tutorial, :alt_augment, :share_url, :restricted, :expandable,
        :expandable_width, :expandable_header_height, :dark_mode_allowed,
        :dark_mode_enabled, :target_color, :target_dashed, :sticky_labels,
        :label_position, :tone_generator_enabled, :analytics_enabled,
        :upload_fr_enabled, :upload_target_enabled, :eq_enabled,
        :eq_bands_default, :eq_bands_max
      )
  end
end
