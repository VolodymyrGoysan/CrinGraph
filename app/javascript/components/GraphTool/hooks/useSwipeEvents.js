import { useState, useRef, useCallback, useMemo } from 'react';
import { throttle } from 'lodash';
import { PANELS, LISTS } from '../constants';

const VERTICAL_DELTA = 200;
const HORISONTAL_DELTA = 100;
const DEFAULT_TOUCH_POSITIONS = {
  yStart: 0,
  yCurrent: 0,
  yDelta: 0,
  xStart: 0,
  xCurrent: 0,
  xDelta: 0,
};

const inRange = (value, min, max) => value > min && value < max;

export default function useSwipeEvents({
  focusedPanel,
  focusPrimary,
  focusSecondary,
  selectedList,
  focusModels,
  focusBrands,
}) {
  const positions = useRef({ ...DEFAULT_TOUCH_POSITIONS });
  const [secondaryPanelStyle, serSecondaryPanelStyle] = useState({});
  const [swipableListStyle, setSwipableListStyle] = useState({});
  
  const handlePanelTouchStart = useCallback((event) => {
    positions.current.yStart = event.targetTouches[0].screenY;
  }, []);

  const handlePanelTouchMoveRaw = useCallback((event) => {
    positions.current.yCurrent = event.targetTouches[0].screenY;
    positions.current.yDelta = positions.current.yCurrent - positions.current.yStart;

    const movingDown = focusedPanel === PANELS.SECONDARY && inRange(positions.current.yDelta, 0, VERTICAL_DELTA);
    const movingUp = focusedPanel === PANELS.PRIMARY && inRange(positions.current.yDelta, -VERTICAL_DELTA, 0);

    if (movingDown || movingUp) {
      serSecondaryPanelStyle({ top: positions.current.yDelta });
    }
  }, [serSecondaryPanelStyle, focusedPanel]);

  const handlePanelTouchMove = useMemo(() => (
    throttle(handlePanelTouchMoveRaw, 30)
  ), [handlePanelTouchMoveRaw]);

  const handlePanelTouchEnd = useCallback(() => {
    if (positions.current.yDelta > 49) focusPrimary();
    if (positions.current.yDelta < -50) focusSecondary();

    serSecondaryPanelStyle({});
    positions.current = { ...DEFAULT_TOUCH_POSITIONS };
  }, [focusPrimary, focusSecondary]);

  const handlePanelWheel = useCallback((event) => {
    const wheelDelta = event.deltaY;

    if (wheelDelta < -5) focusPrimary();
    if (wheelDelta > 5) focusSecondary();
  }, [focusPrimary, focusSecondary]);

  const handleListTouchStart = useCallback((event) => {
    positions.current.xStart = event.targetTouches[0].screenX;
  }, []);
  
  const handleListTouchMoveRaw = useCallback((event) => {
    positions.current.xCurrent = event.targetTouches[0].screenX;
    positions.current.xDelta = positions.current.xCurrent - positions.current.xStart;
      
    const movingRight = selectedList === LISTS.MODELS && inRange(positions.current.xDelta, 0, HORISONTAL_DELTA);
    const movingLeft = selectedList === LISTS.BRANDS && inRange(positions.current.xDelta, -HORISONTAL_DELTA, 0);
    
    if (movingRight || movingLeft) {
      setSwipableListStyle({ right: -positions.current.xDelta })
    }
  }, [selectedList]);

  const handleListTouchMove = useMemo(() => (
    throttle(handleListTouchMoveRaw, 30)
  ), [handleListTouchMoveRaw]);

  const handleListTouchEnd = useCallback(() => {
    if (positions.current.xDelta > 49) focusBrands();
    if (positions.current.xDelta < -50) focusModels()

    setSwipableListStyle({});
    positions.current = { ...DEFAULT_TOUCH_POSITIONS };
  }, [focusBrands, focusModels]);

  return {
    secondaryPanelStyle,
    swipableListStyle,
    handlePanelTouchStart,
    handlePanelTouchMove,
    handlePanelTouchEnd,
    handlePanelWheel,
    handleListTouchStart,
    handleListTouchMove,
    handleListTouchEnd,
  }
}
