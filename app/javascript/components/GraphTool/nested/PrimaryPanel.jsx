import React from 'react';

import GraphBox from './GraphBox';
import Accessories from './Accessories';
import ExternalLinks from './ExternalLinks';
import TutorialButtons from './TutorialButtons';
import PhonesTable from './PhonesTable';

import useFrequencyRangesTutorial from '../hooks/useFrequencyRangesTutorial';

const PrimaryPanel = ({
  togglePrimarySecondaryFocus,
  toggleExpandCollapse,
  externalLinks,
  focusSecondary,
}) => {
  const {
    tutorialActive,
    disableActiveTutorial,
    hoveredTutorialDefinition,
    activeTutorialDefinition,
    handleClickTutorialButton,
    handleMouseOverTutorialButton,
    handleMouseOutTutorialButton,
    handleTouchEndTutorialButton,
  } = useFrequencyRangesTutorial();

  return (
    <section
      className="parts-primary"
      data-tutorial-active={tutorialActive}
    >
      <GraphBox
        onGraphBoxClick={togglePrimarySecondaryFocus}
        toggleExpandCollapse={toggleExpandCollapse}
        disableActiveTutorial={disableActiveTutorial}
        activeTutorialDefinition={activeTutorialDefinition}
        hoveredTutorialDefinition={hoveredTutorialDefinition}
        // onDownload={onDownload}
      />
      
      <div className="manage">
        <TutorialButtons
          activeTutorialDefinition={activeTutorialDefinition}
          onClickTutorialButton={handleClickTutorialButton}
          onMouseOverTutorialButton={handleMouseOverTutorialButton}
          onMouseOutTutorialButton={handleMouseOutTutorialButton}
          onTouchEndTutorialButton={handleTouchEndTutorialButton}
        />

        <PhonesTable
          onMobileHelperClick={focusSecondary}
        />
      </div>

      <Accessories />

      <ExternalLinks links={externalLinks} />
    </section>
  )
};

export default PrimaryPanel;