export default function buildExpandableParentBodyStyle({ expandableHeaderHeight }) {
  return `
    :root {
      --header-height: ${expandableHeaderHeight}px;
    }

    body[data-graph-frame="expanded"] {
      width: 100%;
      height: 100%;
      max-height: -webkit-fill-available;
      overflow: hidden;
    }

    body[data-graph-frame="expanded"] button.graph-frame-collapse {
      display: inherit;
    }

    body[data-graph-frame="expanded"] iframe#GraphTool {
      position: fixed;
      top: var(--header-height);
      left: 0;
      
      width: 100% !important;
      height: calc(100% - var(--header-height)) !important;

      animation-name: graph-tool-expand;
      animation-duration: 0.15s;
      animation-iteration-count: 1;
      animation-timing-function: ease-out;
      animation-fill-mode: forwards;
    }

    @keyframes graph-tool-expand {
      0% {
        position: relative;
        opacity: 1.0;
        transform: scale(1.0);
      }
      48% {
        position: relative;
        opacity: 0.0;
        transform: scale(0.9);
      }
      50% {
        position: fixed;
        opacity: 0.0;
        transform: scale(0.9);
      }
      52% {
        position: fixed;
        opacity: 0.0;
        transform: scale(0.9);
      }
      100% {
        position: fixed;
        opacity: 1.0;
        transform: scale(1.0);
      }
    }
  `;
}
