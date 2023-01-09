import React from 'react';

const PrimaryPanel = ({
  children,
  tutorialActive,
}) => (
  <section
    className="parts-primary"
    data-tutorial-active={tutorialActive}
  >
    {children}
  </section>
);

export default PrimaryPanel;