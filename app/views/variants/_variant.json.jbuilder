json.extract! variant, :id, :unit_id, :name, :fr_data
json.url unit_variant_url(variant.unit, variant, format: :json)
