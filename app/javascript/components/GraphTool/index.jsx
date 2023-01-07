import React from 'react';
import HiddenIcons from './nested/HiddenIcons';
import EqOverlay from './nested/EqOverlay';
import GraphBox from './nested/GraphBox';
import ManageTable from './nested/ManageTable';
import Accessories from './nested/Accessories';
import ExternalLinks from './nested/ExternalLinks';
import Controls from './nested/Controls';

import useGraphBox from './hooks/useGraphBox';
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

  useGraphBox(props);

  return (
    <div className="graphtool">
      <HiddenIcons />

      <main className="main">
        <section className="parts-primary">
          <GraphBox {...props} />
          <ManageTable />
          <Accessories />
          <ExternalLinks />
        </section>

        <section className="parts-secondary">
          <Controls />
        </section>

        <EqOverlay />
      </main>
    </div>
  )
}

export default GraphTool;
