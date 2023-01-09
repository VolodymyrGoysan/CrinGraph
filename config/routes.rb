Rails.application.routes.draw do
  root 'pages#graphtool'

  devise_for :users, controllers: {
    sessions: "users/sessions",
    confirmations: "users/confirmations",
    passwords: "users/passwords",
    registrations: "users/registrations",
    unlocks: "users/unlocks",
    # omniauth_callbacks: "users/omniauth_callbacks"
  }

  get "config", to: "configurations#edit"
  put "update_config", to: "configurations#update"
  patch "update_config", to: "configurations#update"

  resources :units do 
    resources :variants
  end
end
