import React from 'react';

import Controls from './Controls';

import useSwipeEvents from '../../hooks/useSwipeEvents';
import useListsFocus from '../../hooks/useListsFocus';

const SecondaryPanel = ({
  focusedPanel,
  focusPrimary,
  focusSecondary,
}) => {
  const {
    selectedList,
    focusModels,
    focusBrands,
    // focusExtra,
  } = useListsFocus();

  const {
    secondaryPanelStyle,
    swipableListStyle,
    handlePanelTouchStart,
    handlePanelTouchMove,
    handlePanelTouchEnd,
    handlePanelWheel,
    handleListTouchStart,
    handleListTouchMove,
    handleListTouchEnd,
  } = useSwipeEvents({
    focusedPanel,
    focusPrimary,
    focusSecondary,
    selectedList,
    focusModels,
    focusBrands,
  });

  return (
    <section
      style={secondaryPanelStyle}
      className="parts-secondary"
      onClick={focusSecondary}
    >
      <Controls
        selectedList={selectedList}
        focusModels={focusModels}
        focusBrands={focusBrands}
        swipableListStyle={swipableListStyle}
        handlePanelTouchStart={handlePanelTouchStart}
        handlePanelTouchMove={handlePanelTouchMove}
        handlePanelTouchEnd={handlePanelTouchEnd}
        handlePanelWheel={handlePanelWheel}
        handleListTouchStart={handleListTouchStart}
        handleListTouchMove={handleListTouchMove}
        handleListTouchEnd={handleListTouchEnd}

        // focusExtra={focusExtra}
      />
    </section>
  );
}

export default SecondaryPanel;