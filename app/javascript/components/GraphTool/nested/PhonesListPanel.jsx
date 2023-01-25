import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import { arrayOf, func, shape } from 'prop-types';

function PhonesListPanel({
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  focusBrands,
  focusModels,
  outerStyle,
  phonesList,
  onPhoneClick,
  onAddPhoneClick,
  onRemovePhoneClick,
}) {
  const brands = [...(new Set(phonesList.map(({ brand }) => brand)))];
  const [selectedBrand, setSelectedBrand] = useState(null);

  const filteredPhones = useMemo(() => {
    if (!selectedBrand) return phonesList;

    return phonesList.filter(({ brand }) => brand === selectedBrand);
  }, [selectedBrand, phonesList]);

  return (
    <div
      className="scroll-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="scrollOuter"
        onClick={focusBrands}
        data-list="brands"
      >
        <div className="scroll" id="brands">
          {brands.map((brand) => (
            <div
              key={brand}
              className={classNames({ active: brand === selectedBrand })}
              onClick={(event) => {
                event.stopPropagation();
                focusModels();
                setSelectedBrand(brand);
              }}
            >
              {brand}
            </div>
          ))}
        </div>
      </div>

      <div
        className="scrollOuter"
        onClick={focusModels}
        style={outerStyle}
        data-list="models"
      >
        <div className="scroll" id="phones">
          {
            filteredPhones.map((phone) => (
              <div
                key={`${phone.brand}-${phone.name}`}
                className="phone-item"
                onClick={() => onPhoneClick(phone)}
                name={phone.name}
                style={{}}
              >
                <span>{phone.name}</span>
                <div
                  className="phone-item-add"
                  onClick={() => onAddPhoneClick(phone)}
                />
              </div>
            ))
          }

          <div
            className="phone-item"
            name="AirReps AirPods Pro"
            style={{
              background: 'rgb(124, 146, 174)',
              borderColor: 'rgb(124, 146, 174)'
            }}
            data-augment="1"
          >
            <span>AirReps AirPods Pro</span>
            <div className="phone-item-add" onClick={onRemovePhoneClick}>
              <span className="remove">⊗</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

PhonesListPanel.propTypes = {
  phonesList: arrayOf(shape({})),
  handleTouchStart: func,
  handleTouchMove: func,
  handleTouchEnd: func,
  focusBrands: func,
  focusModels: func,
  outerStyle: shape({}),
  onPhoneClick: func,
  onAddPhoneClick: func,
  onRemovePhoneClick: func,
}

export default PhonesListPanel;
