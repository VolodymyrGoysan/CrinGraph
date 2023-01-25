import React from 'react';

import SelectorTabs from './SelectorTabs';
import SearchInput from './SearchInput';
import PhonesList from './PhonesListPanel';
import EqualizerPanel from './EqualizerPanel';

import useSwipeEvents from '../hooks/useSwipeEvents';
import useListsFocus from '../hooks/useListsFocus';

const SecondaryPanel = ({
  focusedPanel,
  focusPrimary,
  focusSecondary,
  phonesList,
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

      <div className="controls">
        <div
          className="select"
          data-selected={selectedList}
        >
          <SelectorTabs
            handleTouchStart={handlePanelTouchStart}
            handleTouchMove={handlePanelTouchMove}
            handleTouchEnd={handlePanelTouchEnd}
            handleWheel={handlePanelWheel}
            onClickBrands={focusBrands}
            onClickModels={focusModels}
            onClickExtra={() => {}}
          />

          <div className="selector-panel">
            <SearchInput
              onTouchStart={handlePanelTouchStart}
              onTouchMove={handlePanelTouchMove}
              onTouchEnd={handlePanelTouchEnd}
              onWheel={handlePanelWheel}
            />

            <svg className="chevron" viewBox="0 0 12 8" preserveAspectRatio="none">
              <path d="M0 0h4c0 1.5,5 3,7 4c-2 1,-7 2.5,-7 4h-4c0 -3,4 -3,4 -4s-4 -1,-4 -4" />
            </svg>

            <svg className="stop" viewBox="0 0 4 1">
              <path d="M4 1H0C3 1 3.2 0.8 4 0Z" />
            </svg>

            <PhonesList
              handleTouchStart={handleListTouchStart}
              handleTouchMove={handleListTouchMove}
              handleTouchEnd={handleListTouchEnd}
              focusBrands={focusBrands}
              focusModels={focusModels}
              outerStyle={swipableListStyle}
              phonesList={phonesList}
              onPhoneClick={() => {}}
              onAddPhoneClick={() => {}}
              onRemovePhoneClick={() => {}}
            />
          </div>

          <EqualizerPanel />
        </div>
      </div>
    </section>
  );
}

export default SecondaryPanel;