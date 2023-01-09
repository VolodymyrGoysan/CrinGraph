import React from 'react';
import { string, bool, number, shape } from 'prop-types';

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

const GraphTool = ({ config }) => {
  const {
    focusedPanel,
    focusPrimary,
    focusSecondary,
    toggleFocus,
  } = usePanelFocusChange();

  const {
    dataGraphFrame,
    dataExpandable,
    toggleExpandCollapse,
  } = useFullscreen(config)

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
          <PrimaryPanel>
            <GraphBox
              altStickyGraph={config.altStickyGraph}
              altAnimated={config.altAnimated}
              labelPosition={config.labelPosition}
              normalizationDb={config.normalizationDb}
              normalizationHz={config.normalizationHz}
              darkModeAllowed={config.darkModeAllowed}
              expandable={config.expandable}
              onGraphBoxClick={toggleFocus}
              toggleExpandCollapse={toggleExpandCollapse}
              // onDownload={onDownload}
            />

            <ManageTable
              onMobileHelperClick={focusSecondary}
            />

            <Accessories />
            
            <ExternalLinks />
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
  }),
};

export default GraphTool;
