class CreateVariants < ActiveRecord::Migration[7.0]
  def change
    create_table :variants do |t|
      t.references :unit, null: false, foreign_key: true
      t.string :name
      t.string :channel, null: false, default: "L"
      t.boolean :default, null: false, default: false
      t.jsonb :fr_data, null: false, default: {}

      t.timestamps
    end
  end
end
