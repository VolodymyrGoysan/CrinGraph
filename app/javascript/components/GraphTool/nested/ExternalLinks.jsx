import React, { useRef } from 'react';
import { groupBy } from 'lodash';
import { arrayOf, number, shape, string } from 'prop-types';

const renderLink = ({ id, url, name }) => (
  <a key={id} href={url} target="_blank" rel="noreferrer">
    {name}
  </a>
);

const renderGroup = (groupName) => (
  <span key={groupName}>
    {groupName}
  </span>
);

const ExternalLinks = ({ links }) => {
  const { current: linkGroups } = useRef(groupBy(links, 'group'));

  return (
    <div className="external-links">
      {Object.entries(linkGroups).flatMap(([groupName, groupLinks]) => [
        renderGroup(groupName), ...groupLinks.map(renderLink)
      ])}
    </div>
  );
}

ExternalLinks.propTypes = {
  links: arrayOf(shape({
    id: number,
    group: string,
    name: string,
    url: string,
  }))
};

export default ExternalLinks;
