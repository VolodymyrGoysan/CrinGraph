import React from 'react';

const SearchInput = ({
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onWheel,
}) => (
  <input
    className="search"
    type="text"
    inputMode="search"
    placeholder="Search"
    onClick={console.log}
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
    onWheel={onWheel}
    // onClick="this.focus();this.select()"
  />
);

export default SearchInput;