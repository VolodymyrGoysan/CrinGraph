import { useState, useCallback } from 'react';
import { LISTS } from '../constants';

export default function usePanelFocus() {
  const [selectedList, setSelectedList] = useState(LISTS.BRANDS);

  // TODO: add extra - window.hideExtraPanel && window.hideExtraPanel(selectedList);
  const focusBrands = useCallback(() => setSelectedList(LISTS.BRANDS), [setSelectedList]);
  const focusModels = useCallback(() => setSelectedList(LISTS.MODELS), [setSelectedList]);
  
  return {
    selectedList,
    focusModels,
    focusBrands,
  }
}
