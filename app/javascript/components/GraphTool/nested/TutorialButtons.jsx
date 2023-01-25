import React, { useContext } from 'react';
import ConfigContext from '../configContext';
import { TUTORIAL_DEFINITIONS } from '../constants';

function TutorialButtons({
  activeTutorialDefinition,
  onClickTutorialButton,
  onMouseOverTutorialButton,
  onMouseOutTutorialButton,
  onTouchEndTutorialButton,
}) {
  const { altTutorial } = useContext(ConfigContext);

  if (!altTutorial) return null;

  return (
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
  );
}

export default TutorialButtons;