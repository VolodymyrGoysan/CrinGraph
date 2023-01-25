import React, { useContext } from 'react';
import ConfigContext from '../configContext';

function Accessories() {
  const { accessories } = useContext(ConfigContext);

  return (
    <div className="accessories">
      <div dangerouslySetInnerHTML={{ __html: accessories }} />
    </div>
  );
}

export default Accessories;