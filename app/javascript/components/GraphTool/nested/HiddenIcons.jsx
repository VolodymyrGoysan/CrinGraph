import React from 'react';

function HiddenIcons() {
  return (
    <svg style={{ display: 'none' }}>
      <defs>
        <g id="baseline-icon" textAnchor="middle" fontSize="100px" fill="currentColor">
          <text dominantBaseline="central" y="-57">BASE</text>
          <text dominantBaseline="central" y="57">-LINE</text>
        </g>
        <g id="hide-icon">
          <path d="M2 6Q7 0 12 6Q7 12 2 6Z" strokeWidth="1" stroke="currentColor" fill="none" />
          <circle cx="7" cy="6" r="2" stroke="none" fill="currentColor" />
          <line strokeWidth="1" x1="4.4" y1="10.3" x2="10.4" y2="2.3" className="keyBackground" />
          <line strokeWidth="1" x1="3.6" y1="9.7" x2="9.6" y2="1.7" stroke="currentColor" />
        </g>
        <g id="pin-icon" textAnchor="middle" fontSize="100px" fill="currentColor">
          <text dominantBaseline="central">
            PIN
          </text>
        </g>
      </defs>
    </svg>
  );
}

export default HiddenIcons;