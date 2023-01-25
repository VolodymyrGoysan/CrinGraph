import React from 'react';

function EqualizerPanel() {
  return (
    <div className="extra-panel" style={{ display: 'none' }}>
      <div className="extra-upload">
        <h5>Uploading</h5>

        <button className="upload-fr">Upload FR</button>
        <button className="upload-target">Upload Target</button>

        <br />

        <span><small>Uploaded data will not be persistent</small></span>

        <form style={{ display: 'none' }}>
          <input
            type="file"
            id="file-fr"
            accept=".csv,.txt"
            onClick={console.log}
          />
        </form>
      </div>

      <div className="extra-eq">
        <h5>Parametric Equalizer</h5>
        <div className="select-eq-phone">
          <select name="phone" defaultValue="">
            <option value="">Choose EQ model</option>
          </select>
        </div>

        <div className="filters-header">
          <span>Type</span>
          <span>Frequency</span>
          <span>Gain</span>
          <span>Q</span>
        </div>

        <div className="filters">
          <div className="filter">
            <span>
              <input
                name="enabled"
                type="checkbox"
                onChange={console.log}
                defaultChecked
              />
              <select name="type" defaultValue="PK">
                <option value="PK">PK</option>
                <option value="LSQ">LSQ</option>
                <option value="HSQ">HSQ</option>
              </select>
            </span>

            <span>
              <input
                name="freq"
                type="number"
                min="20"
                max="20000"
                step="1"
                defaultValue="0"
                onClick={console.log}
              />
            </span>

            <span>
              <input
                name="gain"
                type="number"
                min="-40"
                max="40"
                step="0.1"
                defaultValue="0"
                onClick={console.log}
              />
            </span>

            <span>
              <input
                name="q"
                type="number"
                min="0"
                max="10"
                step="0.1"
                defaultValue="0"
                onClick={console.log}
              />
            </span>
          </div>
        </div>

        <div className="settings-row">
          <span>AutoEQ Range</span>

          <span>
            <input
              name="autoeq-from"
              type="number"
              min="20"
              max="20000"
              step="1"
              defaultValue="20"
              onClick={console.log}
            />
          </span>

          <span>
            <input
              name="autoeq-to"
              type="number"
              min="20"
              max="20000"
              step="1"
              defaultValue="20000"
              onClick={console.log}
            />
          </span>
        </div>

        <div className="filters-button">
          <button className="add-filter">＋</button>
          <button className="remove-filter">－</button>
          <button className="sort-filters">Sort</button>
          <button className="autoeq">AutoEQ</button>
          <button className="import-filters">Import</button>
          <button className="export-filters">Export</button>
          <button className="export-graphic-filters">Export: Graphic EQ / Wavelet</button>
          <button className="export-filters-qudelix">Export: Qudelix</button>
          <button className="readme">Readme</button>
        </div>

        <a style={{ display: 'none' }} id="file-filters-export" />

        <form style={{ display: 'none' }}>
          <input
            type="file"
            id="file-filters-import"
            accept=".txt"
            onClick={console.log}
          />
        </form>
      </div>

      <div className="extra-tone-generator">
        <h5>Tone Generator</h5>

        <div className="settings-row">
          <span>Freq Range</span>
          <span>
            <input
              name="tone-generator-from"
              type="number"
              min="20"
              max="20000"
              step="1"
              defaultValue="20"
              onClick={console.log}
            />
          </span>

          <span>
            <input
              name="tone-generator-to"
              type="number"
              min="20"
              max="20000"
              step="1"
              defaultValue="20000"
              onClick={console.log}
            />
          </span>
        </div>

        <div>
          <input
            name="tone-generator-freq"
            type="range"
            min="0"
            max="1"
            step="0.0001"
            defaultValue="0"
            onClick={console.log}
          />
        </div>

        <div>
          <button className="play">Play</button>
          <span>Frequency: <span className="freq-text">20</span> Hz</span>
        </div>
      </div>
    </div>
  );
}

export default EqualizerPanel;