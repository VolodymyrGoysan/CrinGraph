import React from 'react';

function ManageTable({
  onMobileHelperClick,
}) {
  return (
    <div className="manage">
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