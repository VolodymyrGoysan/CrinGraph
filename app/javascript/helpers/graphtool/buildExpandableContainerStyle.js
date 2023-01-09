export default function buildExpandableContainerStyle({ expandableWidth }) {
  return `
    @media ( max-width: ${expandableWidth}px ) {
      .graphtool-container[data-expandable="only"][data-graph-frame="collapsed"] {
        overflow: hidden;
      }

      .graphtool-container[data-expandable="only"][data-graph-frame="collapsed"] div.expand-collapse {
        position: fixed;
        top: 0;
        left: 0;

        display: flex;
        justify-content: center;
        align-items: center;

        width: 100%;
        height: 100%;
        padding: 0;

        background-color: var(--background-color);
        background-color: transparent;
        border: none;
      }

      .graphtool-container[data-expandable="only"][data-graph-frame="collapsed"] div.expand-collapse:after {
        position: absolute;

        content: 'Tap to launch graph tool';

        color: var(--font-color-primary);
        font-family: var(--font-secondary);
        font-size: 11px;
        line-height: 1em;
        text-transform: uppercase;

        pointer-events: none;
      }

      .graphtool-container[data-expandable="only"][data-graph-frame="collapsed"] div.expand-collapse button#expand-collapse {
        display: flex;
        justify-content: center;
        align-items: center;

        width: 100%;
        height: 100%;

        background-color: transparent;
      }

      .graphtool-container[data-expandable="only"][data-graph-frame="collapsed"] div.expand-collapse button#expand-collapse:before {
        position: relative;
        z-index: 1;

        transform: scale(7);
      }

      .graphtool-container[data-expandable="only"][data-graph-frame="collapsed"] div.expand-collapse button#expand-collapse:after {
        position: absolute;
        top: 0;
        left: 0;

        content: '';

        display: block;
        width: 100%;
        height: 100%;

        background-color: var(--background-color);

        opacity: 0.9;
      }

      .graphtool-container[data-expandable="only"][data-graph-frame="collapsed"] section.parts-primary {
        flex: 100% 1 1;
        overflow: hidden;
      }

      .graphtool-container[data-expandable="only"][data-graph-frame="collapsed"] section.parts-secondary {
        display: none;
      }
    }
  `;
}
