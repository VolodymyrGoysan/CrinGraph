class UnitsController < ApplicationController
  before_action :authenticate_user!, only: %i[new edit create update destroy]
  before_action :set_current_users_unit, only: %i[show edit update destroy]

  def index
    @units = Unit.where(user_id: current_account.id).includes(:variants)
  end

  def show
  end

  def new
    @unit = current_user.units.new
    @unit.variants = [@unit.variants.new(default: true)]
  end

  def edit
  end

  def create
    @unit = current_user.units.new(unit_params)

    respond_to do |format|
      if @unit.save
        format.html { redirect_to unit_url(@unit), notice: "Unit was successfully created." }
        format.json { render :show, status: :created, location: @unit }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @unit.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    respond_to do |format|
      if @unit.update(unit_params)
        format.html { redirect_to unit_url(@unit), notice: "Unit was successfully updated." }
        format.json { render :show, status: :ok, location: @unit }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @unit.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @unit.destroy

    respond_to do |format|
      format.html { redirect_to units_url, notice: "Unit was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private

  def set_current_users_unit
    @unit = current_user.units.find(params[:id])
  end

  def unit_params
    params
      .fetch(:unit)
      .permit(
        :user_id, :construction_type, :brand, :name,
        variants_attributes: [
          :id, :name, :channel, :default, :file, :_destroy
        ]
      )
  end
end
