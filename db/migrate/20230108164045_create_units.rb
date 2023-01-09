class CreateUnits < ActiveRecord::Migration[7.0]
  def change
    create_table :units do |t|
      t.references :user, null: false, foreign_key: true
      t.string :construction_type
      t.string :brand
      t.string :name

      t.timestamps
    end
  end
end
