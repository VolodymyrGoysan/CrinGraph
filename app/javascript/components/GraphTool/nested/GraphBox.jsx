import React, { useContext } from 'react';

import useTheme from '../hooks/useDarkTheme';
import useCopyUrlButton from '../hooks/useCopyUrlButton';

import { TUTORIAL_DEFINITIONS } from '../constants';
import ConfigContext from '../configContext';

const GraphBox = ({
  onDownload,
  onGraphBoxClick,
  toggleExpandCollapse,
  activeTutorialDefinition,
  hoveredTutorialDefinition,
  disableActiveTutorial,
}) => {
  const config = useContext(ConfigContext);
  const { toggleTheme } = useTheme();
  const { copyUrlButtonClass, onCopyUrlButtonClick } = useCopyUrlButton();
  const {
    altStickyGraph ,
    altAnimated,
    altTutorial,
    labelPosition,
    normalizationDb,
    normalizationHz,
    darkModeAllowed,
    expandable,
  } = config;

  return (
    <div
      className="graphBox"
      data-sticky-graph={altStickyGraph}
      data-animated={altAnimated}
    >
      <div
        className="graph-sizer"
        onClick={onGraphBoxClick}
      >
        {
          altTutorial && (
            <div className="tutorial-overlay">
              {TUTORIAL_DEFINITIONS.map(({ name, width }) => (
                <div
                  className="overlay-segment"
                  key={name}
                  data-tutorial-def={name}
                  data-tutorial-hovered={name === hoveredTutorialDefinition}
                  data-tutorial-active={name === activeTutorialDefinition}
                  style={{ flexBasis: width }}
                />
              ))}
            </div>
          )
        }

        <svg
          id="fr-graph"
          viewBox="0 0 800 346"
          data-labels-position={labelPosition}
        />
      </div>

      <div className="tools collapseTools">
        <div className="copy-url">
          <button
            id="copy-url"
            onClick={onCopyUrlButtonClick}
            className={copyUrlButtonClass}
          >
            Copy URL
          </button>

          <button
            onClick={onDownload}
            id="download-faux"
          >
            Screenshot
          </button>
        </div>

        <div className="zoom">
          <span>Zoom:</span>
          <button
            onClick={() => {
              // zoom to bass
              disableActiveTutorial();
            }}
          >
            Bass
          </button>

          <button
            onClick={() => {
              // zoom to mids
              disableActiveTutorial();
            }}
          >
            Mids
          </button>
          
          <button
            onClick={() => {
              // zoom to treble
              disableActiveTutorial();
            }}
          >
            Treble
          </button>
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
          <button id="inspector">
            <span>╞</span> inspect
          </button>
          
          <button id="label">
            <span>▭</span> label
          </button>
          
          <button id="download" onClick={onDownload}>
            <span><u>⇩</u></span> screenshot
          </button>
          
          <button id="recolor">
            <span>○</span> recolor
          </button>

          {darkModeAllowed && (
            <button id="theme" onClick={toggleTheme}>
              Dark Mode
            </button>
          )}
        </div>

        {expandable && (
          <>
            <div className="expand-collapse">
              <button
                id="expand-collapse"
                onClick={toggleExpandCollapse}
              />
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
          </>
        )}
      </div>
    </div>
  );
}

GraphBox.defaultProps = {
  onDownload: () => {},
  onContainerClick: () => {},
};

export default GraphBox;