# frozen_string_literal: true

module Serializable
  extend ActiveSupport::Concern

  included do
    class_attribute(:object_method_name)
    class_attribute(:attribute_names)

    def serialize
      attribute_names.to_h do |attribute|
        [
          camelize(attribute),
          resolve_attribute_value(attribute)
        ]
      end
    end

    private

    def resolve_attribute_value(attribute)
      return send(attribute) if self.class.method_defined?(attribute)
      
      object_to_serialize.send(attribute)
    end

    def object_to_serialize
      @object_to_serialize ||= send(object_method_name)
    end

    def camelize(key)
      key.to_s.delete_suffix("?").camelize(:lower).to_sym
    end
  end

  class_methods do
    def serializable_object(object_method_name)
      self.object_method_name = object_method_name
    end

    def serializable_attributes(*attribute_names)
      self.attribute_names = attribute_names
    end
  end
end
