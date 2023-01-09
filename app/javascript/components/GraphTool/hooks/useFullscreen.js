import { useState, useEffect, useCallback } from 'react';
import addStyleToDocument from 'helpers/addStyleToDocument';
import buildExpandableParentBodyStyle from 'helpers/graphtool/buildExpandableParentBodyStyle';
import buildExpandableContainerStyle from 'helpers/graphtool/buildExpandableContainerStyle';

// Designed to be used only when render from iframe
function useFullscreen({ expandable, expandableWidth, expandableHeaderHeight }) {
  // TODO: fixme
  // const graphIsIframe = (window.top !== window.self) ? true : false;
  const graphIsIframe = true;
  const [expanded, setExpanded] = useState(false);

  const toggleExpandCollapse = () => {
    // TODO: check for accessDocumentTop
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

    // TODO: check for graphIsIframe && expandableWidth
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