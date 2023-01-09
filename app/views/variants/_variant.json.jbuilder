json.extract! variant, :id, :unit_id, :name, :fr_data, :file, :created_at, :updated_at
json.url variant_url(variant, format: :json)
json.file url_for(variant.file)
