import React from 'react';

import Controls from './Controls';

import useSwipeEvents from '../../hooks/useSwipeEvents';

const SecondaryPanel = ({
  focusedPanel,
  focusPrimary,
  focusSecondary,
}) => {
  const {
    secondaryPanelStyle,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  } = useSwipeEvents({
    focusedPanel,
    focusPrimary,
    focusSecondary,
  });

  return (
    <section
      style={secondaryPanelStyle}
      className="parts-secondary"
      onClick={focusSecondary}
    >
      <Controls
        handleDraggableTouchStart={handleTouchStart}
        handleDraggableTouchMove={handleTouchMove}
        handleDraggableTouchEnd={handleTouchEnd}
        handleDraggableWheel={handleWheel}
      />
    </section>
  );
}

export default SecondaryPanel;