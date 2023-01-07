import React from 'react';

function GraphBox({
  altStickyGraph, altAnimated, labelPosition, normalizationDb, normalizationHz
}) {
  return (
    <div
      className="graphBox"
      data={{
        'sticky-graph': altStickyGraph,
        animated: altAnimated
      }}
    >
      <div className="graph-sizer">
        <svg
          id="fr-graph"
          viewBox="0 0 800 346"
          data={{
            'labels-position': labelPosition
          }}
        />
      </div>

      <div className="tools collapseTools">
        <div className="copy-url">
          <button id="copy-url">Copy URL</button>
          <button id="download-faux">Screenshot</button>
        </div>

        <div className="zoom">
          <span>Zoom:</span>
          <button>Bass</button>
          <button>Mids</button>
          <button>Treble</button>
        </div>

        <div className="normalize">
          <span>Normalize:</span>
          <div>
            <input
              type="number"
              inputMode="decimal"
              id="norm-phon"
              required min="0"
              max="100"
              defaultValue={normalizationDb}
              step="1"
              onClick={console.log}
              // onClick="this.focus();this.select()"
            />
            <span>dB</span>
          </div>
          <div>
            <input
              type="number"
              inputMode="decimal"
              id="norm-fr"
              required
              min="20"
              max="20000"
              defaultValue={normalizationHz}
              step="1"
              onClick={console.log}
              // onClick="this.focus();this.select()"
            />
            <span>Hz</span>
          </div>
          <span className="helptip">
            ?
            <span>
              Choose a dB value to normalize to a target listening level, or a Hz value to make all curves match at that frequency.
            </span>
          </span>
        </div>

        <div className="smooth">
          <span>Smooth:</span>
          <input
            type="number"
            inputMode="decimal"
            id="smooth-level"
            required
            min="0"
            defaultValue="5"
            step="any"
            onClick={console.log}
            // onClick="this.focus();this.select()"
          />
        </div>

        <div className="miscTools">
          <button id="inspector"><span>╞</span> inspect</button>
          <button id="label"><span>▭</span> label</button>
          <button id="download"><span><u>⇩</u></span> screenshot</button>
          <button id="recolor"><span>○</span> recolor</button>
        </div>

        <div className="expand-collapse">
          <button id="expand-collapse"></button>
        </div>

        <svg id="expandTools" viewBox="0 0 14 12">
          <path
            d="M2 2h10M2 6h10M2 10h10"
            strokeWidth="2px"
            stroke="#878156"
            strokeLinecap="round"
            transform="translate(0,0.3)"
          />
          <path
            d="M2 2h10M2 6h10M2 10h10"
            strokeWidth="2px"
            stroke="currentColor"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

export default GraphBox;