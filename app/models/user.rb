class User < ApplicationRecord
  # :omniauthable
  
  devise(
    :confirmable,
    :database_authenticatable,
    :trackable,
    :lockable,
    :registerable,
    :recoverable,
    :rememberable,
    :validatable,
    :timeoutable,
  )
end
