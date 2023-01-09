import React from 'react';
import { TUTORIAL_DEFINITIONS } from '../constants';

function ManageTable({
  onMobileHelperClick,
  altTutorial,
  activeTutorialDefinition,
  onClickTutorialButton,
  onMouseOverTutorialButton,
  onMouseOutTutorialButton,
  onTouchEndTutorialButton,
}) {
  return (
    <div className="manage">
      {altTutorial && (
        <>
          <div className="tutorial-buttons">
            {TUTORIAL_DEFINITIONS.map(({ name }) => (
              <button
                className="button-segment"
                key={name}
                data-tutorial-def={name}
                data-tutorial-active={name === activeTutorialDefinition}
                onClick={() => onClickTutorialButton(name)}
                onMouseOver={() => onMouseOverTutorialButton(name)}
                onMouseOut={() => onMouseOutTutorialButton(name)}
                onTouchEnd={() => onTouchEndTutorialButton(name)}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="tutorial-description">
            {TUTORIAL_DEFINITIONS.map(({ name, description }) => (
              <article
                className="description-segment"
                key={name}
                data-tutorial-def={name}
                data-tutorial-active={name === activeTutorialDefinition}
              >
                <p>
                  {
                    // TODO: consider use of innerHtml
                    description
                  }
                </p>
              </article>
            ))}
          </div>
        </>
      )}

      <table className="manageTable">
        <colgroup>
          <col className="remove" />
          <col className="phoneId" />
          <col className="key" />
          <col className="calibrate" />
          <col className="baselineButton" />
          <col className="hideButton" />
          <col className="lastColumn" />
        </colgroup>

        <tbody className="curves">
          <tr className="addPhone">
            <td className="addButton">⊕</td>
            <td className="helpText" colSpan="5">
              (or middle/ctrl-click when selecting; or pin other IEMs)
            </td>
            <td className="addLock">LOCK</td>
          </tr>
          
          <tr
            className="mobile-helper"
            onClick={onMobileHelperClick}
          >
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ManageTable;