import { useState, useEffect, useCallback } from 'react';
import addStyleToDocument from 'helpers/addStyleToDocument.js';
import buildExpandableParentBodyStyle from '../helpers/style/buildExpandableParentBodyStyle.js';
import buildExpandableContainerStyle from '../helpers/style/buildExpandableContainerStyle.js';

// Designed to be used only when render from iframe
function useFullscreen({ expandable, expandableWidth, expandableHeaderHeight }) {
  const graphIsIframe = window.top !== window;
  const [expanded, setExpanded] = useState(false);

  const toggleExpandCollapse = () => {
    // See if iframe gets CORS error when interacting with window.top.document
    try {
      window.top.document
    } catch (error) {
      console.error(error);

      return;
    }

    setExpanded((prevExpanded) => !prevExpanded);
  }

  const getDataGraphFrame = useCallback(() => {
    if (!expandable) return "";
    if (expanded) return "expanded";

    return "collapsed";
  }, [expandable, expanded]);

  const getDataExpandable = () => {
    if (!expandable) return "false";
    if (graphIsIframe && expandableWidth) return "only";

    return "true";
  };

  useEffect(() => {
    if (!expandable) return;
    
    if (graphIsIframe && expandableWidth) {
      addStyleToDocument(document, buildExpandableContainerStyle({ expandableWidth }));
    }

    addStyleToDocument(window.top.document, buildExpandableParentBodyStyle({ expandableHeaderHeight }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const parentBody = window.top.document.querySelector("body");

    parentBody.setAttribute("data-graph-frame", getDataGraphFrame());
  }, [getDataGraphFrame]);

  return {
    dataGraphFrame: getDataGraphFrame(),
    dataExpandable: getDataExpandable(),
    toggleExpandCollapse,
  }
}

export default useFullscreen;