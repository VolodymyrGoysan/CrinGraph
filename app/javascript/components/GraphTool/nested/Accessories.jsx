import { string } from 'prop-types';
import React from 'react';

function Accessories({ content }) {
  return (
    <div className="accessories">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

Accessories.propTypes = {
  content: string,
}

export default Accessories;