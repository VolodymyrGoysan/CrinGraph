class VariantsController < ApplicationController
  before_action :set_unit
  before_action :set_variant, only: %i[show edit update destroy]

  def index
    @variants = Variant.where(unit_id: params[:unit_id])
  end

  def show
  end

  def new
    @variant = Variant.new
  end

  def edit
  end

  def create
    @variant = Variant.new(variant_params)

    respond_to do |format|
      if @variant.save
        format.html { redirect_to variant_url(@variant), notice: "Variant was successfully created." }
        format.json { render :show, status: :created, location: @variant }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @variant.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    respond_to do |format|
      if @variant.update(variant_params)
        format.html { redirect_to variant_url(@variant), notice: "Variant was successfully updated." }
        format.json { render :show, status: :ok, location: @variant }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @variant.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @variant.destroy

    respond_to do |format|
      format.html { redirect_to variants_url, notice: "Variant was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private

  def set_unit
    @unit = Unit.find(params[:unit_id])
  end

  def set_variant
    @variant = @unit.variants.find(params[:id])
  end

  def variant_params
    params.require(:variant).permit(:unit_id, :name, :fr_data, :file)
  end
end
