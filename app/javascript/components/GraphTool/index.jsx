import React from 'react';
import { string, bool, number, shape, arrayOf } from 'prop-types';

import PanelContainer from './nested/PanelContainer';
import PrimaryPanel from './nested/PrimaryPanel';
import SecondaryPanel from './nested/secondary-panel';
import HiddenIcons from './nested/HiddenIcons';
import EqOverlay from './nested/EqOverlay';
import GraphBox from './nested/GraphBox';
import ManageTable from './nested/ManageTable';
import Accessories from './nested/Accessories';
import ExternalLinks from './nested/ExternalLinks';

import useGraphBox from './hooks/useGraphBox';
import usePanelFocusChange from './hooks/usePanelFocus';

import './styles.scss';
import useFullscreen from './hooks/useFullscreen';
import useFrequencyRangesTutorial from './hooks/useFrequencyRangesTutorial';

const GraphTool = ({
  config,
  externalLinks,
}) => {
  const {
    focusedPanel,
    focusPrimary,
    focusSecondary,
    togglePrimarySecondaryFocus,
  } = usePanelFocusChange();

  const {
    dataGraphFrame,
    dataExpandable,
    toggleExpandCollapse,
  } = useFullscreen(config)

  const {
    tutorialActive,
    disableActiveTutorial,
    hoveredTutorialDefinition,
    activeTutorialDefinition,
    handleClickTutorialButton,
    handleMouseOverTutorialButton,
    handleMouseOutTutorialButton,
    handleTouchEndTutorialButton,
  } = useFrequencyRangesTutorial(config);

  useGraphBox(config);

  return (
    <div
      className="graphtool-container"
      data-expandable={dataExpandable}
      data-graph-frame={dataGraphFrame}
    >
      <div className="graphtool">
        <HiddenIcons />

        <PanelContainer focusedPanel={focusedPanel}>
          <PrimaryPanel
            tutorialActive={tutorialActive}
          >
            <GraphBox
              altStickyGraph={config.altStickyGraph}
              altAnimated={config.altAnimated}
              altTutorial={config.altTutorial}
              labelPosition={config.labelPosition}
              normalizationDb={config.normalizationDb}
              normalizationHz={config.normalizationHz}
              darkModeAllowed={config.darkModeAllowed}
              expandable={config.expandable}
              onGraphBoxClick={togglePrimarySecondaryFocus}
              toggleExpandCollapse={toggleExpandCollapse}
              disableActiveTutorial={disableActiveTutorial}
              activeTutorialDefinition={activeTutorialDefinition}
              hoveredTutorialDefinition={hoveredTutorialDefinition}
              // onDownload={onDownload}
            />

            <ManageTable
              altTutorial={config.altTutorial}
              activeTutorialDefinition={activeTutorialDefinition}
              onMobileHelperClick={focusSecondary}
              onClickTutorialButton={handleClickTutorialButton}
              onMouseOverTutorialButton={handleMouseOverTutorialButton}
              onMouseOutTutorialButton={handleMouseOutTutorialButton}
              onTouchEndTutorialButton={handleTouchEndTutorialButton}
            />

            <Accessories content={config.accessories} />
            
            <ExternalLinks links={externalLinks} />
          </PrimaryPanel>

          <SecondaryPanel
            focusedPanel={focusedPanel}
            focusPrimary={focusPrimary}
            focusSecondary={focusSecondary}
          />

          <EqOverlay />
        </PanelContainer>
      </div>
    </div>
  )
}

GraphTool.propTypes = {
  config: shape({
    userId: number,
    watermarkText: string,
    pageTitle: string,
    pageDescription: string,
    dualChannel: bool,
    enabledChannel: string,
    notmalizationType: string,
    normalizationDb: number,
    normalizationHz: number,
    maxChannelImbalance: number,
    altLayout: bool,
    altStickyGraph: bool,
    altAnimated: bool,
    altHeader: bool,
    altHeaderNewTab: bool,
    altTutorial: bool,
    altAugment: bool,
    shareUrl: bool,
    restricted: bool,
    expandable: bool,
    expandableWidth: number,
    expandableHeaderHeight: number,
    darkModeAllowed: bool,
    darkModeEnabled: bool,
    targetColor: string,
    targetDashed: bool,
    stickyLabels: bool,
    labelPosition: string,
    toneGeneratorEnabled: bool,
    analyticsEnabled: bool,
    uploadFrEnabled: bool,
    uploadTargetEnabled: bool,
    eqEnabled: bool,
    eqBandsDefault: number,
    eqBandsMax: number,
    accessories: string,
  }),
  externalLinks: arrayOf(shape({
    group: string,
    name: string,
    url: string,
  })),
};

export default GraphTool;
