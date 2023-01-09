# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2023_01_08_164240) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "action_text_rich_texts", force: :cascade do |t|
    t.string "name", null: false
    t.text "body"
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["record_type", "record_id", "name"], name: "index_action_text_rich_texts_uniqueness", unique: true
  end

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "configurations", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "watermark_text"
    t.string "page_title"
    t.text "page_description"
    t.boolean "dual_channel", default: true, null: false
    t.string "enabled_channel", default: "L", null: false
    t.string "notmalization_type", default: "dB", null: false
    t.integer "normalization_db", default: 60, null: false
    t.integer "normalization_hz", default: 500, null: false
    t.integer "max_channel_imbalance", default: 5, null: false
    t.boolean "alt_layout", default: false, null: false
    t.boolean "alt_sticky_graph", default: true, null: false
    t.boolean "alt_animated", default: false, null: false
    t.boolean "alt_header", default: false, null: false
    t.boolean "alt_header_new_tab", default: true, null: false
    t.boolean "alt_tutorial", default: false, null: false
    t.boolean "alt_augment", default: false, null: false
    t.boolean "share_url", default: true, null: false
    t.boolean "restricted", default: false, null: false
    t.boolean "expandable", default: false, null: false
    t.integer "expandable_width", default: 0, null: false
    t.integer "expandable_header_height", default: 0, null: false
    t.boolean "dark_mode_allowed", default: true, null: false
    t.boolean "dark_mode_enabled", default: false, null: false
    t.string "target_color"
    t.boolean "target_dashed", default: false, null: false
    t.boolean "sticky_labels", default: true, null: false
    t.string "label_position", default: "default", null: false
    t.boolean "tone_generator_enabled", default: true, null: false
    t.boolean "analytics_enabled", default: true, null: false
    t.boolean "upload_fr_enabled", default: true, null: false
    t.boolean "upload_target_enabled", default: true, null: false
    t.boolean "eq_enabled", default: true, null: false
    t.integer "eq_bands_default", default: 10, null: false
    t.integer "eq_bands_max", default: 20, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_configurations_on_user_id"
  end

  create_table "external_links", force: :cascade do |t|
    t.bigint "configuration_id", null: false
    t.string "group"
    t.string "name"
    t.text "url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["configuration_id"], name: "index_external_links_on_configuration_id"
  end

  create_table "units", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "construction_type"
    t.string "brand"
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_units_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "username", default: "", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.integer "failed_attempts", default: 0, null: false
    t.string "unlock_token"
    t.datetime "locked_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["unlock_token"], name: "index_users_on_unlock_token", unique: true
  end

  create_table "variants", force: :cascade do |t|
    t.bigint "unit_id", null: false
    t.string "name"
    t.string "channel", default: "L", null: false
    t.boolean "default", default: false, null: false
    t.jsonb "fr_data", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["unit_id"], name: "index_variants_on_unit_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "configurations", "users"
  add_foreign_key "external_links", "configurations"
  add_foreign_key "units", "users"
  add_foreign_key "variants", "units"
end
