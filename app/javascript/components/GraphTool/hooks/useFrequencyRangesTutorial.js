import { useState } from 'react';

function useFrequencyRangesTutorial() {
  const [activeDefinition, setActiveDefinition] = useState(null);
  const [hoveredDefinition, setHoveredDefinition] = useState(null);
  const tutorialActive = !!activeDefinition;
  const disableActiveTutorial = () => setActiveDefinition(null);
  const disableHoveredTutorial = () => setHoveredDefinition(null);
  
  // Disable zoom if tutorial is engaged
  function disableZoom() {
    let activeZoomButton = document.querySelector("div.zoom button.selected");

    if (activeZoomButton) { activeZoomButton.click(); }
  }

  const handleClickTutorialButton = (definitionName) => {
    if (activeDefinition !== definitionName) {
      setActiveDefinition(definitionName);
      disableZoom();

      // Analytics event
      // if (analyticsEnabled) { pushEventTag("tutorial_activated", targetWindow, def.name); }
    } else {
      disableActiveTutorial();
    }
  }

  return {
    tutorialActive,
    disableActiveTutorial,
    hoveredTutorialDefinition: hoveredDefinition,
    activeTutorialDefinition: activeDefinition,
    handleClickTutorialButton,
    handleMouseOverTutorialButton: setHoveredDefinition,
    handleMouseOutTutorialButton: disableHoveredTutorial,
    handleTouchEndTutorialButton: disableHoveredTutorial,
    
  }
}

export default useFrequencyRangesTutorial;