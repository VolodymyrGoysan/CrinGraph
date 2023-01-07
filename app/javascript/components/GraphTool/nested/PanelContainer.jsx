import React from 'react';

const PanelContainer = ({ focusedPanel, children }) => {
  return (
    <main
      className="main"
      data-focused-panel={focusedPanel}
    >
      {children}
    </main>
  );
}

export default PanelContainer;
