import { useState, useRef, useCallback, useMemo } from 'react';
import { throttle } from 'lodash';
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
  const touchPositions = useRef({ ...DEFAULT_TOUCH_POSITIONS });
  const [secondaryPanelStyle, serSecondaryPanelStyle] = useState({});

  const movingInRange = useCallback((min, max) => (
    touchPositions.current.yDelta > min && touchPositions.current.yDelta < max
  ), []);
  
  const handleTouchStart = useCallback((event) => {
    touchPositions.current.yStart = event.targetTouches[0].screenY;
  }, []);

  const handleTouchMove = useCallback((event) => {
    touchPositions.current.yCurrent = event.targetTouches[0].screenY;
    touchPositions.current.yDelta = touchPositions.current.yCurrent - touchPositions.current.yStart;

    const focusedSecondary = focusedPanel === PANELS.SECONDARY;
    const movingDown = focusedSecondary && movingInRange(0, MOVING_UP_DELTA);
    const movingUp = !focusedSecondary && movingInRange(MOVING_DOWN_DELTA, 0);

    if (movingDown || movingUp) {
      serSecondaryPanelStyle({ top: touchPositions.current.yDelta });
    }
  }, [serSecondaryPanelStyle, movingInRange, focusedPanel]);

  const throttledTouchMove = useMemo(() => (
    throttle(handleTouchMove, 30)
  ), [handleTouchMove]);

  const handleTouchEnd = useCallback(() => {
    if (touchPositions.current.yDelta > 49) focusPrimary();
    if (touchPositions.current.yDelta < -50) focusSecondary();

    serSecondaryPanelStyle({});
    touchPositions.current = { ...DEFAULT_TOUCH_POSITIONS };
  }, [focusPrimary, focusSecondary]);

  const handleWheel = useCallback((event) => {
    const wheelDelta = event.deltaY;

    if (wheelDelta < -5) focusPrimary();
    if (wheelDelta > 5) focusSecondary();
  }, [focusPrimary, focusSecondary])

  return {
    secondaryPanelStyle,
    handleTouchStart,
    handleTouchMove: throttledTouchMove,
    handleTouchEnd,
    handleWheel,
  }
}
