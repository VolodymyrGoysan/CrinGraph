json.extract! unit, :id, :construction_type, :brand, :name
json.url unit_url(unit, format: :json)
json.variants unit.variants do |variant|
  json.name variant.name
  json.channel variant.channel
  json.default variant.default
  json.url unit_variant_url(unit, variant, format: :json)
end
