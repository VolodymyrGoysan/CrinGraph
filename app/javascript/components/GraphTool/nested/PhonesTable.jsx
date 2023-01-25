import React from 'react';

function PhonesTable({
  onMobileHelperClick,
}) {
  return (
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
        <tr className="addPhone"></tr>

        <tr
          className="mobile-helper"
          onClick={onMobileHelperClick}
        >
        </tr>
      </tbody>
    </table>
  );
}

export default PhonesTable;