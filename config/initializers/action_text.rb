require "addressable/uri"

ActionText::ContentHelper.allowed_tags += ["table", "tr", "td", "th", "thead", "tbody"]
ActionText::ContentHelper.allowed_attributes += ["rel", "target"]
