import { useEffect } from "react";
import Equalizer from "lib/equalizer";
import avgCurves from "helpers/avgCurves";

function useExtra(config) {
  const equalizer = new Equalizer();

  useEffect(() => {
    let extraButton = document.querySelector("div.select > div.selector-tabs > button.extra");
    // Disable functions by config
    if (!config.uploadFrEnabled && !config.uploadTargetEnabled && !config.eqEnabled) {
      extraButton.remove();
      return;
    }
    if (!config.uploadFrEnabled) {
      document.querySelector("div.extra-panel > div.extra-upload").style["display"] = "none";
    }
    if (!config.eqEnabled) {
      document.querySelector("div.extra-panel > div.extra-eq").style["display"] = "none";
    }
    if (!config.toneGeneratorEnabled) {
      document.querySelector("div.extra-panel > div.extra-tone-generator").style["display"] = "none";
    }
    // Show and hide extra panel
    window.showExtraPanel = () => {
      document.querySelector("div.select > div.selector-panel").style["display"] = "none";
      document.querySelector("div.select > div.extra-panel").style["display"] = "flex";
      document.querySelector("div.select").setAttribute("data-selected", "extra");
      pushEventTag("clicked_equalizerTab", targetWindow);
    };
    window.hideExtraPanel = (selectedList) => {
      document.querySelector("div.select > div.selector-panel").style["display"] = "flex";
      document.querySelector("div.select > div.extra-panel").style["display"] = "none";
      document.querySelector("div.select").setAttribute("data-selected", selectedList);
    };
    extraButton.addEventListener("click", showExtraPanel);
    // Upload function
    let uploadType = null;
    let fileFR = document.querySelector("#file-fr");
    document.querySelector("div.extra-upload > button.upload-fr").addEventListener("click", () => {
      uploadType = "fr";
      fileFR.click();
    });
    document.querySelector("div.extra-upload > button.upload-target").addEventListener("click", () => {
      uploadType = "target";
      fileFR.click();
    });
    let addOrUpdatePhone = (brand, phone, ch) => {
      let phoneObj = asPhoneObj(brand, phone);
      phoneObj.rawChannels = ch;
      phoneObj.isDynamic = true;
      let phoneObjs = brand.phoneObjs;
      let oldPhoneObj = phoneObjs.filter(p => p.phone == phone.name)[0]
      if (oldPhoneObj) {
        oldPhoneObj.active && removePhone(oldPhoneObj);
        phoneObj.id = oldPhoneObj.id;
        phoneObjs[phoneObjs.indexOf(oldPhoneObj)] = phoneObj;
        allPhones[allPhones.indexOf(oldPhoneObj)] = phoneObj;
      } else {
        brand.phones.push(phone);
        phoneObjs.push(phoneObj);
        allPhones.push(phoneObj);
      }
      updatePhoneSelect();
      return phoneObj;
    };
    fileFR.addEventListener("change", (e) => {
      let file = e.target.files[0];
      if (!file) {
        return;
      }
      let reader = new FileReader();
      reader.onload = (e) => {
        let name = file.name.replace(/\.[^\.]+$/, "");
        let phone = { name: name };
        let ch = [tsvParse(e.target.result)];
        if (ch[0].length < 128) {
          alert("Parse frequence response file failed: invalid format.");
          return;
        }
        ch[0] = equalizer.interp(f_values, ch[0]);
        if (uploadType === "fr") {
          name.match(/ R$/) && ch.splice(0, 0, null);
          let phoneObj = addOrUpdatePhone(brandMap.Uploaded, phone, ch);
          showPhone(phoneObj, false);
        } else if (uploadType === "target") {
          let fullName = name + (name.match(/ Target$/i) ? "" : " Target");
          let existsTargets = targets.reduce((a, b) => a.concat(b.files), []).map(f => f += " Target");
          if (existsTargets.indexOf(fullName) >= 0) {
            alert("This target already exists on this tool, please select it instead of upload.");
            return;
          }
          let phoneObj = {
            isTarget: true,
            brand: brandTarget,
            dispName: name,
            phone: name,
            fullName: fullName,
            fileName: fullName,
            rawChannels: ch,
            isDynamic: true,
            id: -brandTarget.phoneObjs.length
          };
          showPhone(phoneObj, true);
        }
      };
      reader.readAsText(file);
    });
    // EQ Function
    let eqPhoneSelect = document.querySelector("div.extra-eq select[name='phone']");
    let filtersContainer = document.querySelector("div.extra-eq > div.filters");
    let fileFiltersImport = document.querySelector("#file-filters-import");
    let filterEnabledInput, filterTypeSelect,
      filterFreqInput, filterQInput, filterGainInput;
    let eqBands = config.eqBandsDefault;
    let updateFilterElements = () => {
      let node = filtersContainer.querySelector("div.filter");
      while (filtersContainer.childElementCount < eqBands) {
        let clone = node.cloneNode(true);
        clone.querySelector("input[name='enabled']").value = "true";
        clone.querySelector("select[name='type']").value = "PK";
        clone.querySelector("input[name='freq']").value = "0";
        clone.querySelector("input[name='q']").value = "0";
        clone.querySelector("input[name='gain']").value = "0";
        filtersContainer.appendChild(clone);
      }
      while (filtersContainer.childElementCount > eqBands) {
        filtersContainer.children[filtersContainer.childElementCount - 1].remove();
      }
      filterEnabledInput = filtersContainer.querySelectorAll("input[name='enabled']");
      filterTypeSelect = filtersContainer.querySelectorAll("select[name='type']");
      filterFreqInput = filtersContainer.querySelectorAll("input[name='freq']");
      filterQInput = filtersContainer.querySelectorAll("input[name='q']");
      filterGainInput = filtersContainer.querySelectorAll("input[name='gain']");
      filtersContainer.querySelectorAll("input,select").forEach(el => {
        el.removeEventListener("input", applyEQ);
        el.addEventListener("input", applyEQ);
      });
    };
    let elemToFilters = (includeAll) => {
      // Collect filters from ui
      let filters = [];
      for (let i = 0; i < eqBands; ++i) {
        let disabled = !filterEnabledInput[i].checked;
        let type = filterTypeSelect[i].value;
        let freq = parseInt(filterFreqInput[i].value) || 0;
        let q = parseFloat(filterQInput[i].value) || 0;
        let gain = parseFloat(filterGainInput[i].value) || 0;
        if (!includeAll && (disabled || !type || !freq || !q || !gain)) {
          continue;
        }
        filters.push({ disabled, type, freq, q, gain });
      }
      return filters;
    };
    let filtersToElem = (filters) => {
      // Set filters to ui
      let filtersCopy = filters.map(f => f);
      while (filtersCopy.length < eqBands) {
        filtersCopy.push({ type: "PK", freq: 0, q: 0, gain: 0 });
      }
      if (filtersCopy.length > eqBands) {
        eqBands = Math.min(filtersCopy.length, cofig.eq_bands_max);
        filtersCopy = filtersCopy.slice(0, eqBands);
        updateFilterElements();
      }
      filtersCopy.forEach((f, i) => {
        filterEnabledInput[i].checked = !f.disabled;
        filterTypeSelect[i].value = f.type;
        filterFreqInput[i].value = f.freq;
        filterQInput[i].value = f.q;
        filterGainInput[i].value = f.gain;
      });
    };
    let applyEQHandle = null;
    let applyEQExec = () => {
      // Create and show phone with eq applied
      let activeElem = document.activeElement;
      let phoneSelected = eqPhoneSelect.value;
      let filters = elemToFilters();
      if (filters.length && !phoneSelected) {
        let firstPhone = eqPhoneSelect.querySelectorAll("option")[1];
        if (firstPhone) {
          phoneSelected = eqPhoneSelect.value = firstPhone.value;
        }
      }
      let phoneObj = phoneSelected && activePhones.filter(
        p => p.fullName == phoneSelected)[0];
      if (!phoneObj || (!filters.length && !phoneObj.eq)) {
        return; // Allow empty filters if eq is applied before
      }
      let phoneEQ = { name: phoneObj.phone + " EQ" };
      let phoneObjEQ = addOrUpdatePhone(phoneObj.brand, phoneEQ,
        phoneObj.rawChannels.map(c => c ? equalizer.apply(c, filters) : null));
      phoneObj.eq = phoneObjEQ;
      phoneObjEQ.eqParent = phoneObj;
      showPhone(phoneObjEQ, false);
      activeElem.focus();
    };
    let applyEQ = () => {
      clearTimeout(applyEQHandle);
      applyEQHandle = setTimeout(applyEQExec, 100);
    };
    window.updateEQPhoneSelect = () => {
      let oldValue = eqPhoneSelect.value;
      let optionValues = activePhones.filter(p =>
        !p.isTarget && !p.fullName.match(/ EQ$/)).map(p => p.fullName);
      Array.from(eqPhoneSelect.children).slice(1).forEach(c => eqPhoneSelect.removeChild(c));
      optionValues.forEach(value => {
        let optionElem = document.createElement("option");
        optionElem.setAttribute("value", value);
        optionElem.innerText = value;
        eqPhoneSelect.appendChild(optionElem);
      });
      eqPhoneSelect.value = (optionValues.indexOf(oldValue) >= 0) ? oldValue : "";
    };
    updateFilterElements();
    eqPhoneSelect.addEventListener("input", applyEQ);
    // Add new filter
    document.querySelector("div.extra-eq button.add-filter").addEventListener("click", () => {
      eqBands = Math.min(eqBands + 1, extraEQBandsMax);
      updateFilterElements();
    });
    // Remove last filter
    document.querySelector("div.extra-eq button.remove-filter").addEventListener("click", () => {
      eqBands = Math.max(eqBands - 1, 1);
      updateFilterElements();
      applyEQ(); // May removed effective filter
    });
    // Sort filters by frequency
    document.querySelector("div.extra-eq button.sort-filters").addEventListener("click", () => {
      filtersToElem(elemToFilters(true).sort((a, b) =>
        (a.freq || Infinity) - (b.freq || Infinity)));
    });
    // Import filters
    document.querySelector("div.extra-eq button.import-filters").addEventListener("click", () => {
      fileFiltersImport.click();
    });
    fileFiltersImport.addEventListener("change", (e) => {
      // Import filters callback
      let file = e.target.files[0];
      if (!file) {
        return;
      }
      let reader = new FileReader();
      reader.onload = (e) => {
        let settings = e.target.result;
        let filters = settings.split("\n").map(l => {
          let r = l.match(/Filter\s*\d+:\s*(\S+)\s*(\S+)\s*Fc\s*(\S+)\s*Hz\s*Gain\s*(\S+)\s*dB(\s*Q\s*(\S+))?/);
          if (!r) { return undefined; }
          let disabled = (r[1] !== "ON");
          let type = r[2];
          let freq = parseInt(r[3]) || 0;
          let gain = parseFloat(r[4]) || 0;
          let q = parseFloat(r[6]) || 0;
          if (type === "LS" || type === "HS") {
            type += "Q";
            q = q || 0.707;
          } else if (type === "LSC" || type === "HSC") {
            // equalizer APO use LSC/HSC instead of LSQ/HSQ
            type = type.substr(0, 2) + "Q";
          }
          return { disabled, type, freq, q, gain };
        }).filter(f => f);
        while (filters.length > 0) {
          // Remove empty tail filters
          let lastFilter = filters[filters.length - 1];
          if (!lastFilter.freq && !lastFilter.q && !lastFilter.gain) {
            filters.pop();
          } else {
            break;
          }
        }
        if (filters.length > 0) {
          filtersToElem(filters);
          applyEQ();
        } else {
          alert("Parse filters file failed: no filter found.");
        }
      };
      reader.readAsText(file);
    });
    // Export filters
    document.querySelector("div.extra-eq button.export-filters").addEventListener("click", () => {
      let phoneSelected = eqPhoneSelect.value;
      let phoneObj = phoneSelected && activePhones.filter(
        p => p.fullName == phoneSelected && p.eq)[0];
      let filters = elemToFilters(true);
      if (!phoneObj || !filters.length) {
        alert("Please select model and add atleast one filter before export.");
        return;
      }
      let preamp = equalizer.calc_preamp(
        phoneObj.rawChannels.filter(c => c)[0],
        phoneObj.eq.rawChannels.filter(c => c)[0]);
      let settings = "Preamp: " + preamp.toFixed(1) + " dB\r\n";
      filters.forEach((f, i) => {
        let on = (!f.disabled && f.type && f.freq && f.gain && f.q) ? "ON" : "OFF";
        let type = f.type;
        if (type === "LSQ" || type === "HSQ") {
          // equalizer APO use LSC/HSC instead of LSQ/HSQ
          type = type.substr(0, 2) + "C";
        }
        settings += ("Filter " + (i + 1) + ": " + on + " " + type + " Fc " +
          f.freq.toFixed(0) + " Hz Gain " + f.gain.toFixed(1) + " dB Q " +
          f.q.toFixed(3) + "\r\n");
      });
      let exportElem = document.querySelector("#file-filters-export");
      exportElem.href && URL.revokeObjectURL(exportElem.href);
      exportElem.href = URL.createObjectURL(new Blob([settings]));
      exportElem.download = phoneObj.fullName.replace(/^Uploaded /, "") + " Filters.txt";
      exportElem.click();
    });
    // Export filters to Qudelix
    document.querySelector("div.extra-eq button.export-filters-qudelix").addEventListener("click", () => {
      let phoneSelected = eqPhoneSelect.value;
      let phoneObj = phoneSelected && activePhones.filter(
        p => p.fullName == phoneSelected && p.eq)[0];
      let filters = elemToFilters(true);
      if (!phoneObj || !filters.length) {
        alert("Please select model and add atleast one filter before export.");
        return;
      }
      let preamp = equalizer.calc_preamp(
        phoneObj.rawChannels.filter(c => c)[0],
        phoneObj.eq.rawChannels.filter(c => c)[0]);
      let settings = "" + preamp.toFixed(1) + " dB\r\n";
      filters.forEach((f, i) => {
        let on = (!f.disabled && f.type && f.freq && f.gain && f.q) ? "ON" : "OFF";
        let type = f.type;
        if (type === "LSQ" || type === "HSQ") {
          // equalizer APO use LSC/HSC instead of LSQ/HSQ
          type = type.substr(0, 2) + "C";
        }
        settings += (type + " " +
          f.freq.toFixed(0) + " " + f.gain.toFixed(1) + " " +
          f.q.toFixed(3) + "\r\n");
      });
      let exportElem = document.querySelector("#file-filters-export");
      exportElem.href && URL.revokeObjectURL(exportElem.href);
      exportElem.href = URL.createObjectURL(new Blob([settings]));
      exportElem.download = phoneObj.fullName.replace(/^Uploaded /, "") + " Qudelix Filters.q5k";
      exportElem.click();
    });
    // Export filters as graphic eq (for wavelet)
    document.querySelector("div.extra-eq button.export-graphic-filters").addEventListener("click", () => {
      let phoneSelected = eqPhoneSelect.value;
      let phoneObj = phoneSelected && activePhones.filter(
        p => p.fullName == phoneSelected && p.eq)[0] || { fullName: "Unnamed" };
      let filters = elemToFilters();
      if (!filters.length) {
        alert("Please add atleast one filter before export.");
        return;
      }
      let graphicEQ = equalizer.as_graphic_eq(filters);
      let settings = "GraphicEQ: " + graphicEQ.map(([f, gain]) =>
        f.toFixed(0) + " " + gain.toFixed(1)).join("; ");
      let exportElem = document.querySelector("#file-filters-export");
      exportElem.href && URL.revokeObjectURL(exportElem.href);
      exportElem.href = URL.createObjectURL(new Blob([settings]));
      exportElem.download = phoneObj.fullName.replace(/^Uploaded /, "") + " Graphic Filters.txt";
      exportElem.click();
    });
    // Readme
    document.querySelector("div.extra-eq button.readme").addEventListener("click", () => {
      alert("1. If you want to AutoEQ model A to B, display A B and remove target\n" +
        "2. Add/Remove bands before AutoEQ may give you a better result\n" +
        "3. Curve of PK filter close to 20K is implementation dependent, avoid such filter if you're not sure how your DSP software works\n" +
        "4. EQ treble require resonant peak matching and fine tune by ear, keep treble untouched if you're not sure how to do that\n" +
        "5. Tone generator is useful to find actual location of peaks and dips, notice the web version may not work on some platform\n");
    });
    // AutoEQ
    let autoEQFromInput = document.querySelector("div.extra-eq input[name='autoeq-from']");
    let autoEQToInput = document.querySelector("div.extra-eq input[name='autoeq-to']");

    autoEQFromInput.value = equalizer.autoEQRange[0].toFixed(0);
    autoEQToInput.value = equalizer.autoEQRange[1].toFixed(0);
    document.querySelector("div.extra-eq button.autoeq").addEventListener("click", () => {
      // Generate filters automatically
      let phoneSelected = eqPhoneSelect.value;
      if (!phoneSelected) {
        let firstPhone = eqPhoneSelect.querySelectorAll("option")[1];
        if (firstPhone) {
          phoneSelected = eqPhoneSelect.value = firstPhone.value;
        }
      }
      let phoneObj = phoneSelected && activePhones.filter(
        p => p.fullName == phoneSelected)[0];
      let targetObj = (activePhones.filter(p => p.isTarget)[0] ||
        activePhones.filter(p => p !== phoneObj && !p.isTarget)[0]);
      if (!phoneObj || !targetObj) {
        alert("Please select model and target, if there are no target and multiple models are displayed then the second one will be selected as target.");
        return;
      }
      let autoEQOverlay = document.querySelector(".extra-eq-overlay");
      autoEQOverlay.style.display = "block";
      setTimeout(() => {
        let autoEQFrom = Math.min(Math.max(parseInt(autoEQFromInput.value) || 0, 20), 20000);
        let autoEQTo = Math.min(Math.max(parseInt(autoEQToInput.value) || 0, autoEQFrom), 20000);

        equalizer.autoEQRange = [autoEQFrom, autoEQTo];

        let phoneCHs = (phoneObj.rawChannels.filter(c => c)
          .map(ch => ch.map(([f, v]) => [f, v + phoneObj.norm])));
        let phoneCH = (phoneCHs.length > 1) ? avgCurves(phoneCHs) : phoneCHs[0];
        let targetCH = targetObj.rawChannels.filter(c => c)[0].map(([f, v]) => [f, v + targetObj.norm]);
        let filters = equalizer.autoeq(phoneCH, targetCH, eqBands);
        filtersToElem(filters);
        applyEQ();
        autoEQOverlay.style.display = "none";
      }, 100);
    });
    // Tone Generator
    let toneGeneratorFromInput = document.querySelector("div.extra-tone-generator input[name='tone-generator-from']");
    let toneGeneratorToInput = document.querySelector("div.extra-tone-generator input[name='tone-generator-to']");
    let toneGeneratorSlider = document.querySelector("div.extra-tone-generator input[name='tone-generator-freq']");
    let toneGeneratorPlayButton = document.querySelector("div.extra-tone-generator .play");
    let toneGeneratorText = document.querySelector("div.extra-tone-generator .freq-text");
    let toneGeneratorContext = null;
    let toneGeneratorOsc = null;
    let toneGeneratorTimeoutHandle = null
    toneGeneratorSlider.addEventListener("input", () => {
      let from = Math.min(Math.max(parseInt(toneGeneratorFromInput.value) || 0, 20), 20000);
      let to = Math.min(Math.max(parseInt(toneGeneratorToInput.value) || 0, from), 20000);
      let position = parseFloat(toneGeneratorSlider.value) || 0;
      let freq = Math.round(Math.exp( // Slider move in log scale
        Math.log(from) + (Math.log(to) - Math.log(from)) * position));
      toneGeneratorText.innerText = freq;
      if (toneGeneratorOsc) {
        let t = toneGeneratorContext.currentTime;
        toneGeneratorOsc.frequency.cancelScheduledValues(t);
        toneGeneratorOsc.frequency.setTargetAtTime(freq, t, 0.2); // Smoother transition but also delay
      }
    });
    toneGeneratorPlayButton.addEventListener("click", () => {
      if (toneGeneratorOsc) {
        toneGeneratorOsc.stop();
        toneGeneratorOsc = null;
        toneGeneratorPlayButton.innerText = "Play";
      } else {
        if (!toneGeneratorContext) {
          if (!window.AudioContext) {
            alert("Web audio api is disabled, please enable it if you want to use tone generator.");
            return;
          }
          toneGeneratorContext = new AudioContext();
        }
        toneGeneratorOsc = toneGeneratorContext.createOscillator();
        toneGeneratorOsc.type = "sine";
        toneGeneratorOsc.frequency.value = parseInt(toneGeneratorText.innerText);
        toneGeneratorOsc.connect(toneGeneratorContext.destination);
        toneGeneratorOsc.start();
        toneGeneratorPlayButton.innerText = "Stop";
      }
    });
  }, []);
}

export default useExtra;