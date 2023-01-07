import React from 'react';
import HiddenIcons from './nested/HiddenIcons';
import EqOverlay from './nested/EqOverlay';
import GraphBox from './nested/GraphBox';
import ManageTable from './nested/ManageTable';
import Accessories from './nested/Accessories';
import ExternalLinks from './nested/ExternalLinks';
import Controls from './nested/Controls';

import useGraphBox from './hooks/useGraphBox';
import useSwipeEvents from './hooks/useSwipeEvents';
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

  const {
    secondaryPanelStyle,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  } = useSwipeEvents({
    focusedPanel,
    focusPrimary,
    focusSecondary,
  });

  useGraphBox(props);

  return (
    <div className="graphtool">
      <HiddenIcons />

      <main
        className="main"
        data-focused-panel={focusedPanel}
      >
        <section className="parts-primary">
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
        </section>

        <section
          style={secondaryPanelStyle}
          className="parts-secondary"
          onClick={() => focusSecondary()}
        >
          <Controls
            handleDraggableTouchStart={handleTouchStart}
            handleDraggableTouchMove={handleTouchMove}
            handleDraggableTouchEnd={handleTouchEnd}
            handleDraggableWheel={handleWheel}
          />
        </section>

        <EqOverlay />
      </main>
    </div>
  )
}

export default GraphTool;
