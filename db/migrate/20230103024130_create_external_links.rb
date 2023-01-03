class CreateExternalLinks < ActiveRecord::Migration[7.0]
  def change
    create_table :external_links do |t|
      t.references :configuration, null: false, foreign_key: true
      t.string :group
      t.string :name
      t.text :url

      t.timestamps
    end
  end
end
