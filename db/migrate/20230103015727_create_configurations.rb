class CreateConfigurations < ActiveRecord::Migration[7.0]
  def change
    create_table :configurations do |t|
      t.references :user, null: false, foreign_key: true
      
      t.string :watermark_text
      t.string :page_title
      t.text :page_description

      t.boolean :dual_channel, null: false, default: true
      t.string :enabled_channel, null: false, default: "L"
      t.string :notmalization_type, null: false, default: "dB"
      t.integer :normalization_db, null: false, default: 60
      t.integer :normalization_hz, null: false, default: 500
      t.integer :max_channel_imbalance, null: false, default: 5
      
      t.boolean :alt_layout, null: false, default: false
      t.boolean :alt_sticky_graph, null: false, default: true
      t.boolean :alt_animated, null: false, default: false
      t.boolean :alt_header, null: false, default: false
      t.boolean :alt_header_new_tab, null: false, default: true
      t.boolean :alt_tutorial, null: false, default: false
      t.boolean :alt_augment, null: false, default: false
      
      t.boolean :share_url, null: false, default: true
      t.boolean :restricted, null: false, default: false
      
      t.boolean :expandable, null: false, default: false
      t.integer :expandable_width, null: false, default: 0
      t.integer :expandable_header_height, null: false, default: 0
      
      t.boolean :dark_mode_allowed, null: false, default: true
      t.boolean :dark_mode_enabled, null: false, default: false
      
      t.string :target_color
      t.boolean :target_dashed, null: false, default: false
      t.boolean :sticky_labels, null: false, default: true
      t.string :label_position, null: false, default: "default"
      
      t.boolean :tone_generator_enabled, null: false, default: true
      t.boolean :analytics_enabled, null: false, default: true
      t.boolean :upload_fr_enabled, null: false, default: true
      t.boolean :upload_target_enabled, null: false, default: true
      t.boolean :eq_enabled, null: false, default: true
      t.integer :eq_bands_default, null: false, default: 10
      t.integer :eq_bands_max, null: false, default: 20

      t.timestamps
    end
  end
end
