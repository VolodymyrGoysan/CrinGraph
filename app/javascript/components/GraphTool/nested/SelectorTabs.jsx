import { func } from 'prop-types';
import React from 'react';

const SelectorTabs = ({
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleWheel,
  onClickBrands,
  onClickModels,
  onClickExtra,
}) => {
  return (
    <div
      className="selector-tabs"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <button
        className="brands"
        data-list="brands"
        onClick={onClickBrands}
      >
        Brands
      </button>

      <button
        className="models"
        data-list="models"
        onClick={onClickModels}
      >
        Models
      </button>

      <button
        className="extra"
        onClick={onClickExtra}
      >
        Equalizer
      </button>
    </div>
  );
};

SelectorTabs.propTypes = {
  handleTouchStart: func.isRequired,
  handleTouchMove: func.isRequired,
  handleTouchEnd: func.isRequired,
  handleWheel: func.isRequired,
  onClickBrands: func.isRequired,
  onClickModels: func.isRequired,
  onClickExtra: func.isRequired,
};

export default SelectorTabs;
