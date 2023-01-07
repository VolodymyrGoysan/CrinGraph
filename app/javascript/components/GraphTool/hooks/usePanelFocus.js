import { useState, useCallback } from 'react';
import { PANELS } from '../constants';

export default function usePanelFocus() {
  const [focusedPanel, setFocusedPanel] = useState(PANELS.SECONDARY);
  
  const focusSecondary = useCallback(() => setFocusedPanel(PANELS.SECONDARY), [setFocusedPanel]);
  const focusPrimary = useCallback(() => setFocusedPanel(PANELS.PRIMARY), [setFocusedPanel]);
  const toggleFocus = useCallback(() => setFocusedPanel((prevPanel) => (
    prevPanel === PANELS.SECONDARY ? PANELS.PRIMARY : PANELS.SECONDARY
  )), [setFocusedPanel]);
  
  return {
    focusedPanel,
    focusPrimary,
    focusSecondary,
    toggleFocus,
  }
}
