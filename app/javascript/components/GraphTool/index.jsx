import React from 'react';

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

const GraphTool = (props) => {
  // userId,
  // watermarkText,
  // pageTitle,
  // pageDescription,
  // dualChannel,
  // enabledChannel,
  // notmalizationType,
  // normalizationDb,
  // normalizationHz,
  // maxChannelImbalance,
  // altLayout,
  // altStickyGraph,
  // altAnimated,
  // altHeader,
  // altHeaderNewTab,
  // altTutorial,
  // altAugment,
  // shareUrl,
  // restricted,
  // expandable,
  // expandableWidth,
  // expandableHeaderHeight,
  // darkModeAllowed,
  // darkModeEnabled,
  // targetColor,
  // targetDashed,
  // stickyLabels,
  // labelPosition,
  // toneGeneratorEnabled,
  // analyticsEnabled,
  // uploadFrEnabled,
  // uploadTargetEnabled,
  // eqEnabled,
  // eqBandsDefault,
  // eqBandsMax

  const {
    focusedPanel,
    focusPrimary,
    focusSecondary,
    toggleFocus,
  } = usePanelFocusChange();

  useGraphBox(props);

  return (
    <div className="graphtool">
      <HiddenIcons />

      <PanelContainer focusedPanel={focusedPanel}>
        <PrimaryPanel>
          <GraphBox
            altStickyGraph={props.altStickyGraph}
            altAnimated={props.altAnimated}
            labelPosition={props.labelPosition}
            normalizationDb={props.normalizationDb}
            normalizationHz={props.normalizationHz}
            darkModeAllowed={props.darkModeAllowed}
            onGraphBoxClick={toggleFocus}
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
  )
}

export default GraphTool;
