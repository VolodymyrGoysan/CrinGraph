import { useState, useRef } from 'react';
import { PANELS } from '../constants';

const MOVING_UP_DELTA = 200;
const MOVING_DOWN_DELTA = -200;
const DEFAULT_TOUCH_POSITIONS = {
  yStart: 0,
  yCurrent: 0,
  yDelta: 0,
};

export default function useSwipeEvents({
  focusedPanel,
  focusPrimary,
  focusSecondary,
}) {
  const touchPositions = useRef(DEFAULT_TOUCH_POSITIONS);
  const [secondaryPanelStyle, serSecondaryPanelStyle] = useState({});

  const focusedSecondary = () => focusedPanel === PANELS.SECONDARY;

  const movingInRange = (min, max) => (
    touchPositions.current.yDelta > min && touchPositions.current.yDelta < max
  );
  
  const handleTouchStart = (event) => {
    touchPositions.current.yStart = event.targetTouches[0].screenY;
  };

  const handleTouchMove = (event) => {
    touchPositions.current.yCurrent = event.targetTouches[0].screenY;
    touchPositions.current.yDelta = touchPositions.current.yCurrent - touchPositions.current.yStart;

    const secondaryPanelMovingUp = focusedSecondary() && movingInRange(0, MOVING_UP_DELTA);
    const primaryPanelMovingDown = !focusedSecondary() && movingInRange(MOVING_DOWN_DELTA, 0);

    if (secondaryPanelMovingUp || primaryPanelMovingDown) {
      serSecondaryPanelStyle({ top: touchPositions.current.yDelta });
    }
  };

  const handleTouchEnd = (_event) => {
    if (touchPositions.current.yDelta > 49) focusPrimary();
    if (touchPositions.current.yDelta < -50) focusSecondary();

    serSecondaryPanelStyle({});
    touchPositions.current = DEFAULT_TOUCH_POSITIONS;
  };

  const handleWheel = (event) => {
    const wheelDelta = event.deltaY;

    if (wheelDelta < -5) focusPrimary();
    if (wheelDelta > 5) focusSecondary();
  }

  return {
    secondaryPanelStyle,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  }
}
