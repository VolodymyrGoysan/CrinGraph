class DefaultEnvironmentService
	class << self
		def external_links
			JSON.parse(external_links_data).flat_map do |group|
				group["links"].map do |link|
					ExternalLink.new(
						group: group["label"],
						name: link["name"],
						url: link["url"]
					)
				end
			end
		end

		private

		def external_links_data
			File.read(extrnal_link_seed_path)
		end

		def extrnal_link_seed_path
			Rails.root.join("db/seed/external_links.json")
		end
	end
end
