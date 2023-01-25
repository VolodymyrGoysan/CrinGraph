import React from 'react';
import { string, bool, number, shape, arrayOf } from 'prop-types';

import ConfigContext from './configContext';
import PanelContainer from './nested/PanelContainer';
import PrimaryPanel from './nested/PrimaryPanel';
import SecondaryPanel from './nested/SecondaryPanel';
import HiddenIcons from './nested/HiddenIcons';
import EqOverlay from './nested/EqOverlay';
import usePhones from './hooks/usePhones';
import useFullscreen from './hooks/useFullscreen';
import usePanelFocusChange from './hooks/usePanelFocus';

import './styles.scss';

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
    phonesList,
  } = usePhones(config);

  return (
    <ConfigContext.Provider value={config}>
      <div
        className="graphtool-container"
        data-expandable={dataExpandable}
        data-graph-frame={dataGraphFrame}
      >
        <div className="graphtool">
          <HiddenIcons />

          <PanelContainer focusedPanel={focusedPanel}>
            <PrimaryPanel
              togglePrimarySecondaryFocus={togglePrimarySecondaryFocus}
              toggleExpandCollapse={toggleExpandCollapse}
              externalLinks={externalLinks}
              focusSecondary={focusSecondary}
            />

            <SecondaryPanel
              focusedPanel={focusedPanel}
              focusPrimary={focusPrimary}
              focusSecondary={focusSecondary}
              phonesList={phonesList}
            />

            <EqOverlay />
          </PanelContainer>
        </div>
      </div>
    </ConfigContext.Provider>
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
