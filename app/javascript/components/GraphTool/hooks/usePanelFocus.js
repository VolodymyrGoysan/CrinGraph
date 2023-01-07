import { useState } from 'react';
import { PANELS } from '../constants';

export default function usePanelFocus() {
  const [focusedPanel, setFocusedPanel] = useState(PANELS.SECONDARY);
  
  const focusSecondary = () => setFocusedPanel(PANELS.SECONDARY);
  const focusPrimary = () => setFocusedPanel(PANELS.PRIMARY);
  const toggleFocus = () => setFocusedPanel((prevPanel) => (
    prevPanel === PANELS.SECONDARY ? PANELS.PRIMARY : PANELS.SECONDARY
  ));
  
  return {
    focusedPanel,
    focusPrimary,
    focusSecondary,
    toggleFocus,
  }
}
