import { useEffect, useState } from 'react';
import axios from 'axios';

import { mean, min, selectAll, select, merge, curveNatural, curveCardinal, range, max, interpolateNumber } from 'd3';

import Normalizer from 'lib/normalizer';
import Smoothener from 'lib/smoothener';

import frToIndex from "helpers/frToIndex";
import getCurveColor from 'helpers/getCurveColor';
import avgCurves from 'helpers/avgCurves';

import {
  phoneOffset,
  // phoneFullName,
  channelName,
  isMultichannel,
  hasChannelSel,
  hasImbalance,
} from 'helpers/phone';

import getAverage from '../../../helpers/getAverage';
import buildFrequencyValues from '../../../helpers/buildFrequencyValues';

import { LD_P1 } from '../constants';
import GraphBox from 'lib/graphbox';

const getDivColor = (id, active) => {
  let c = getCurveColor(id, 0);
  c.l = 100 - (80 - Math.min(c.l, 60)) / (active ? 1.5 : 3);
  c.c = (c.c - 20) / (active ? 3 : 4);
  return c;
}

const getBgColor = (p) => {
  let c = getCurveColor(p.id, 0).rgb();
  ['r', 'g', 'b'].forEach(p => c[p] = 255 - (255 - Math.max(0, c[p])) * 0.85);
  return c;
}

function usePhones(config) {
  const {
    restricted,
    notmalizationType: initialNotmalizationType,
    normalizationHz: initialNormalizationHz,
    normalizationDb: initialNormalizationDb,
  } = config;

  const [
    targets,
    // setTargets
  ] = useState([]);
  const [
    phonesList,
    setPhonesList
  ] = useState([]);
  const [
    activePhones,
    setActivePhones,
  ] = useState([]); // TODO: load from href

  const [labelsShown, setLabelsShown] = useState(false);

  const [normalizationType, setNormalizationType] = useState(initialNotmalizationType);
  const [normalizationDb, setNormalizationDb] = useState(initialNormalizationDb);
  const [normalizationHz, setNormalizationHz] = useState(initialNormalizationHz);
  const [smoothLevel, setSmoothLevel] = useState(5);

  const normalizationIndex = normalizationType.toLowerCase() === "db" ? 0 : 1;
  const setNormalizationIndex = (index) => setNormalizationType(index === 0 ? "dB" : "Hz");

  const max_compare = restricted ? 2 : null;
  const restrict_target = !restricted;
  const disallow_target = restricted;
  const premium_html = restricted ? "<h2>You gonna pay for that?</h2><p>To use target curves, or more than two graphs, <a target='_blank' href='https://crinacle.com/wp-login.php?action=register'>subscribe</a> or upgrade to Patreon <a target='_blank' href='https://www.patreon.com/join/crinacle/checkout?rid=3775534'>Silver tier</a> and switch to <a target='_blank' href='https://crinacle.com/graphs/iems/graphtool/premium/'>the premium tool</a>.</p>" : "";
  const sampnums = config.num_samples ? range(1, config.num_samples + 1) : [""];
  const LR = config.dualChannel ? ["L", "R"] : [config.enabledChannel];
  const keyExt = LR.length === 1 ? 16 : 0;
  const keyLeft = keyExt ? 0 : sampnums.length > 1 ? 11 : 0;
  let yCenter = 60;
  let phoneNumber = 0; // Find a phone id which doesn't have a color conflict with pins
  let nextPN = 0; // Cached value; invalidated when pinned headphones change
  let smoothScale = 0.01 * (config.scaleSmoothing || 1);

  const loadPhonesList = () => {
    axios
      .get('/units.json')
      .then(({ data }) => setPhonesList(data));
  };

  const frequencyValues = buildFrequencyValues();

  const normalizer = new Normalizer({
    frequencyValues,
  });

  const smoothener = new Smoothener({
    smoothLevel,
    smoothScale,
    frequencyValues,
  });

  const graphBox = new GraphBox({
    config,
    yCenter,
  });

  let norms = select(".normalize").selectAll("div");

  let brands = [];
  let brandMap = {};
  let inits = [];
  let initReq = config.initPhones || [];
  let loadFromShare = 0;
  let initMode = "config";
  let addPhoneSet = false; // Whether add phone button was clicked
  let addPhoneLock = false;

  const baseline0 = { p: null, l: null, fn: l => l };
  let baseline = baseline0;

  let targetWindow;

  // See if iframe gets CORS error when interacting with window.top
  try {
    targetWindow = window.location.href.includes('embed') ? window : window.top;
  } catch (error) {
    targetWindow = window;
    console.error(error);
  }

  if (config.shareUrl) {
    let url = targetWindow.location.href;
    let par = "share=";
    let emb = "embed";

    if (url.includes(par) && url.includes(emb)) {
      initReq = decodeURIComponent(url.replace(/_/g, " ").split(par).pop()).split(",");
      loadFromShare = 2;
    } else if (url.includes(par)) {
      initReq = decodeURIComponent(url.replace(/_/g, " ").split(par).pop()).split(",");
      loadFromShare = 1;
    }
  }

  let isInit = (f) => initReq ? (initReq.indexOf(f) !== -1) : false;

  if (loadFromShare === 1) {
    initMode = "share";
  } else if (loadFromShare === 2) {
    initMode = "embed";
  } else {
    initMode = "config";
  }

  brands.push({ name: "Uploaded", phones: [], active: false, phoneObjs: [] });
  brands.forEach(b => brandMap[b.name] = b);
  brands.forEach(function (b) {
    b.active = false;
    b.phoneObjs = b.phones.map(function (p) {
      return asPhoneObj(b, p, isInit, inits);
    });
  });

  let allPhones = merge(brands.map(b => b.phoneObjs));
  let currentBrands = [];
  if (!initReq) inits.push(allPhones[0]);

  function normalizePhone(phone) {
    if (normalizationIndex === 1) { // fr
      let i = frToIndex(normalizationHz, frequencyValues);
      let avg = l => 20 * Math.log10(mean(l, d => Math.pow(10, d / 20)));
      
      phone.norm = 60 - avg(phone.channels.filter(Boolean).map(l => l[i][1]));
    } else { // phon
      const avg = getAverage(phone);
      
      phone.norm = normalizer.find_offset(avg, normalizationDb);
    }
    if (phone.eq) {
      phone.eq.norm = phone.norm; // copy parent's norm to child
    } else if (phone.eqParent) {
      phone.norm = phone.eqParent.norm; // set child's norm from parent
    }
  }

  function smoothPhone(phone) {
    if (phone.smooth === smoothLevel) return;

    phone.channels = phone.rawChannels.filter(Boolean).map((channel) => (
      smoothener
        .smooth(channel.map(d => d[1]), channel)
        .map((d, i) => [channel[i][0], d])
    ));

    phone.smooth = smoothLevel;

    setCurves(phone);
  }

  function nextPhoneNumber() {
    if (nextPN === null) {
      nextPN = phoneNumber;
      let pin = activePhones.filter(p => p.pin).map(p => p.id);
      if (pin.length) {
        let p3 = LD_P1 * LD_P1 * LD_P1;
        let l = a => b => Math.abs(((a - b) / p3 + 0.5) % 1 - 0.5);
        let d = id => min(pin, l(id));

        for (let i = nextPN, max = d(i); max < 0.12 && ++i < phoneNumber + 3;) {
          let m = d(i);
          if (m > max) { max = m; nextPN = i; }
        }
      }
    }

    return nextPN;
  }

  function getPhoneNumber() {
    let pn = nextPhoneNumber();
    phoneNumber = pn + 1;
    nextPN = null;

    return pn;
  }

  function getBaseline(phone) {
    let b = getAverage(phone).map(d => d[1] + phoneOffset(phone));
    
    return {
      p: phone,
      l: null,
      fn: l => l.map((e, i) => [
        e[0], e[1] - b[Math.min(i, b.length - 1)]
      ])
    };
  }

  function setNorm(_, i, change) {
    if (change !== false) {
      if (!this.checkValidity()) return;
      let v = +this.value;
      
      if (i) {
        setNormalizationHz(v);
      } else {
        setNormalizationDb(v);
      }
    }

    setNormalizationIndex(i);

    norms.classed("selected", (_, i) => i === normalizationIndex);
    
    activePhones.forEach((phone) => normalizePhone(phone));

    if (baseline.p) { baseline = getBaseline(baseline.p); }
    
    graphBox.updateYCenter();
    graphBox.updatePaths();
  }

  let colorBar = p => 'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 8"><path d="M0 8v-8h1c0.05 1.5,-0.3 3,-0.16 5s0.1 2,0.15 3z" fill="' + getBgColor(p) + '"/></svg>\')';

  function setHover(elt, h) {
    elt.on("mouseover", h(true)).on("mouseout", h(false));
  }

  function asPhoneObj(b, p, isInit, inits) {
    if (!isInit) {
      isInit = () => false;
    }
    let r = { brand: b, dispBrand: b.name };
    if (typeof p === "string") {
      r.phone = r.fileName = p;
      if (isInit(p)) inits.push(r);
    } else {
      r.phone = p.name;
      if (p.collab) {
        r.dispBrand += " x " + p.collab;
        r.collab = brandMap[p.collab];
      }
      let f = p.file || p.name;
      if (typeof f === "string") {
        r.fileName = f;
        if (isInit(f)) inits.push(r);
      } else {
        r.fileNames = f;
        r.vars = {};
        let dns = f;
        if (p.suffix) {
          dns = p.suffix.map(
            s => p.name + (s ? " " + s : "")
          );
        } else if (p.prefix) {
          let reg = new RegExp(`^${p.prefix}s*`, "i");
          dns = f.map(n => {
            n = n.replace(reg, "");
            return p.name + (n.length ? " " + n : n);
          });
        }
        r.dispNames = dns;
        r.fileName = f[0];
        r.dispName = dns[0];
        let c = r;
        f.map((fn, i) => {
          if (!isInit(fn)) return;
          c.fileName = fn; c.dispName = dns[i];
          inits.push(c);
          // @ts-ignore
          c = { copyOf: r };
        });
      }
    }
    r.dispName = r.dispName || r.phone;
    r.fullName = r.dispBrand + " " + r.phone;
    if (config.altAugment) {
      r.reviewScore = p.reviewScore;
      r.reviewLink = p.reviewLink;
      r.shopLink = p.shopLink;
      r.price = p.price;
    }
    return r;
  }

  function removeCopies(p) {
    if (p.objs) {
      p.objs.forEach(q => q.active = false);
      delete p.objs;
    }
    removePhone(p);
  }

  function setPhoneTr(phtr) {
    phtr.each(function (p) {
      p.highlight = p.active;
      let o = p.objs; if (!o) return;
      p.objs = o = o.filter(q => q.active);
      if (o.length === 0) {
        delete p.objs;
      } else if (!p.active) {
        p.id = o[0].id;
        p.highlight = true;
      }
    });
    phtr.style("background", p => p.isTarget && !p.active ? null : getDivColor(p.id, p.highlight))
      .style("border-color", p => p.highlight ? getDivColor(p.id, 1) : null);
    phtr.filter(p => !p.isTarget)
      .select(".phone-item-add")
      .selectAll(".remove").data(p => p.highlight ? [p] : [])
      .join("span").attr("class", "remove").text("⊗")
      .on("click", p => {
        // d3.event.stopPropagation();
        removeCopies(p);
      });
  }

  function updateVariant(phone) {
    updateKey(graphBox.table.selectAll("tr").filter(q => q === phone).select(".keyLine"));
    normalizePhone(phone);
    graphBox.updatePaths();
  }

  function addColorPicker(svg) {
    svg.attr("viewBox", "0 0 9 5.3");
    svg.append("rect").attrs({ x: 0, y: 0, width: 9, height: 5.3, fill: "none" });
    svg.call(cpCircles);
    makeColorPicker(svg);
  }

  function changeVariant(phone, update, trigger) {
    let fn = phone.fileName;
    let ch = phone.vars[fn];

    function set(ch) {
      phone.rawChannels = ch;
      phone.smooth = undefined;

      smoothPhone(phone);
      setCurves(phone);
      update(phone, 0, 0, trigger);
    }

    if (ch) {
      set(ch);
    } else {
      loadFiles(phone, set);
    }
  }

  const currency = [
    ["$", "#348542"],
    ["¥", "#d11111"],
    ["€", "#2961d4"],
    ["฿", "#dcaf1d"]
  ];

  let currencyCounter = -1;
  let lastMessage = null;
  let messageWeight = 0;
  let cantTarget = (phone) => {
    if (!disallow_target) return false
    if (!config.allowedTargets) return phone.isTarget;

    let targetNames = config.allowedTargets.map(f => f.replace(/ Target$/, ""));
    let filename = phone.fileName.replace(/ Target$/, "");

    return phone.isTarget && targetNames.indexOf(filename) < 0;
  };

  let ccfilter = restrict_target ? (l => l) : (l => l.filter(p => !p.isTarget));

  const cantCompare = (ps, add, p, noMessage) => {
    if (disallow_target || max_compare) {
      let count = ccfilter(ps).length + (add || 0) - (!restrict_target && p && p.isTarget ? 1 : 0);
      if (count < max_compare && !(p && cantTarget(p))) { return false; }
      if (noMessage) { return true; }
      let div = select(".graphtool").append("div");
      let c = currency[currencyCounter++ % currency.length];
      let lm = lastMessage;
      lastMessage = Date.now();
      messageWeight *= Math.pow(2, (lm ? lm - lastMessage : 0) / 3e4); // 30-second half-life
      messageWeight++;
      if (!currencyCounter || messageWeight >= 2) {
        messageWeight /= 2;
        let button = div.attr("class", "cashMessage")
          .html(premium_html)
          .append("button").text("Fine")
          .on("mousedown", () => messageWeight = 0);
        button.node().focus();
        let back = select(".graphtool").append("div")
          .attr("class", "fadeAll");
        [button, back].forEach(e =>
          e.on("click", () => [div, back].forEach(e => e.remove()))
        );
      } else {
        div.attr("class", "cash")
          .style("color", c[1]).text(c[0])
          .transition().duration(120).remove();
      }
      return true;
    } else {
      return false;
    }
  }

  let labelButton = select("#label");
  
  // function setLabelButton(l) {
  //   labelButton.classed("selected", labelsShown = l);
  // }

  labelButton.on("click", () => {
    labelsShown ? graphBox.clearLabels : graphBox.drawLabels;
    setLabelsShown((prev) => !prev);
  });

  function showVariant(p, c, trigger) {
    // @ts-ignore
    if (cantCompare(activePhones)) return;
    if (!p.objs) { p.objs = [p]; }
    
    p.objs.push(c);
    c.active = true;
    c.copyOf = p;
    
    ["brand", "dispBrand", "fileNames", "vars"].map(k => c[k] = p[k]);
    
    changeVariant(c, showPhone, trigger);
  }

  function cpCircles(svg) {
    svg.selectAll("circle")
      .data(p => [[3, 3, 2], [6.6, 4, 1]].map(([cx, cy, r]) => ({ cx, cy, r, fill: getBgColor(p) })))
      .join("circle").attrs(d => d);
  }

  function makeColorPicker(elt) {
    elt.on("click", function (p) {
      p.id = getPhoneNumber();
      colorPhones();
      // d3.event.stopPropagation();
    });
  }

  const channelboxX = c => c ? -86 : -36;
  const channelboxTranslate = c => "translate(" + channelboxX(c) + ",0)";

  function setCurves(p, avg, lr, samp) {
    if (avg === undefined) avg = p.avg;
    if (samp === undefined) samp = avg ? false : LR.length === 1 || p.ssamp || false;
    else { p.ssamp = samp; if (samp) avg = false; }
    let dx = +avg - +p.avg;
    let n = sampnums.length;
    let selCh = (l, i) => l.slice(i * n, (i + 1) * n);
    p.avg = avg;
    p.samp = samp = n > 1 && samp;
    
    if (!p.isTarget) {
      let v = cs => cs.filter(c => c !== null);
      let cs = p.channels;
      let cv = v(cs);
      let mc = cv.length > 1;
      let pc = (idstr, l, oi) => ({
        id: channelName(p, idstr),
        l: l,
        p: p,
        o: oi === undefined ? 0 : (!config.dualChannel ? 0 :oi * 2 / (LR.length - 1) - 1),
      });

      p.activeCurves = avg && mc ? [pc("AVG", avgCurves(cv))] : (
        !samp && mc ? LR.map((l, i) => pc(l, avgCurves(v(selCh(cs, i))), i)) : (
          cs.map((l, i) => pc(LR[Math.floor(i / n)] + sampnums[i % n], l, Math.floor(i / n)))
        )
      ).filter(c => c.l);

    } else {
      p.activeCurves = [{ id: p.fullName, l: p.channels[0], p: p, o: 0 }];
    }
    let y = 0;
    let k = selectAll(".keyLine").filter(q => q === p);
    let ksb = k.select(".keySelBoth").attr("display", "none");
    p.lr = lr;
    if (lr !== undefined) {
      p.activeCurves = p.samp ? selCh(p.activeCurves, lr) : [p.activeCurves[lr]];
      y = [-1, 1][lr];
      ksb.attr("display", null).attr("y", [0, -12][lr]);
    }

    k
      .select(".keyMask")
      .transition().duration(400)
      .attr("x", channelboxX(avg))
      // @ts-ignore
      .attrTween("y", function () {
        // @ts-ignore
        let y0 = +this.getAttribute("y");
        let y1 = 12 * (-1 + y);

        if (!dx) return interpolateNumber(y0, y1);

        let ym = y0 + (y1 - y0) * (3 - 2 * dx) / 6;
        y0 -= ym;
        y1 -= ym;

        return t => { t -= 1 / 2; return ym + (t < 0 ? y0 : y1) * Math.pow(2, 20 * (Math.abs(t) - 1 / 2)); };
      });

    k.select(".keySel").attr("transform", channelboxTranslate(avg));
    k.selectAll(".keySamp").attr("opacity", (_, i) => i === +samp ? 1 : 0.6);
  }

  function updateCurves() {
    setCurves.apply(null, arguments); // ???
    graphBox.updatePaths();
  }

  // TODO: consider renaming
  function handleKeyOnlyMouseMove(pi) {
    let p = pi[0];
    let cs = p.activeCurves;

    if (!p.hide && cs.length === 2) {
      // d3.event.stopPropagation();

      graphBox.highlight(p, c => c === cs[pi[1]]);
      graphBox.clearLabels();
      graphBox.gpath
        .selectAll("path")
        .filter(c => c.p === p)
        .attr("opacity", (c) => c !== cs[pi[1]] ? 0.7 : null);
    }
  }

  function handleKeyOnlyMouseOut(pi) {
    let p = pi[0];
    let cs = p.activeCurves;

    if (!p.hide && cs.length === 2) {
      // d3.event.stopPropagation();

      graphBox.highlight(p, true);
      graphBox.clearLabels();
      graphBox.gpath
        .selectAll("path")
        .filter(c => c.p === p)
        .attr("opacity", null);
    }
  }

  function addKey(s) {
    let dim = { x: -19 - keyLeft, y: -12, width: 65 + keyLeft, height: 24 };

    s
      .attr("class", "keyLine")
      .attr("viewBox", [dim.x, dim.y, dim.width, dim.height].join(" "));

    let defs = s.append("defs");

    defs
      .append("linearGradient").attr("id", p => "chgrad" + p.id)
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 1)
      .selectAll()
      .data(p => [0.1, 0.4, 0.6, 0.9].map(o => [o, getCurveColor(p.id, o < 0.3 ? -1 : o < 0.7 ? 0 : 1)]))
      .join("stop")
      .attr("offset", i => i[0])
      .attr("stop-color", i => i[1]);

    defs
      .append("linearGradient").attr("id", "blgrad")
      .selectAll().data([0, 0.25, 0.31, 0.69, 0.75, 1]).join("stop")
      .attr("offset", o => o)
      .attr("stop-color", (o, i) => i == 2 || i == 3 ? "white" : "#333");

    let m =
      defs
        .append("mask")
        .attr("id", p => "chmask" + p.id);

    m
      .append("rect")
      .attr("x", dim.x)
      .attr("y", dim.y)
      .attr("width", dim.width)
      .attr("height", dim.height)
      .attr("fill", "#333");

    m
      .append("rect")
      .attr("class", "keyMask")
      .attr("x", p => channelboxX(p.avg))
      .attr("y", -12)
      .attr("width", 120)
      .attr("height", 24)
      .attr("fill", "url(#blgrad)");

    let t = s.append("g");

    t
      .append("path")
      .attr("stroke", p => isMultichannel(p) ? "url(#chgrad" + p.id + ")" : getCurveColor(p.id, 0));

    t
      .selectAll()
      .data(p => p.isTarget ? [] : LR)
      .join("text")
      .attr("class", "keyCLabel")
      .attr("x", 17 + keyExt)
      .attr("y", (_, i) => 12 * (i - (LR.length - 1) / 2))
      .attr("dy", "0.32em")
      .attr("text-anchor", "start")
      .attr("font-size", 10.5)
      .text(t => t);

    t
      .filter(p => p.isTarget)
      .append("text")
      .attr("x", keyExt ? 7 : 17)
      .attr("y", keyExt ? 6 : 0)
      .attr("text-anchor", keyExt ? "middle" : "start")
      .attr("dy", "0.32em")
      .attr("font-size", 8)
      .attr("fill", p => getCurveColor(p.id, 0))
      .text("Target");

    let uchl = f => function (p) {
      updateCurves(p, f(p));
      graphBox.highlight(p, true);
    }

    s
      .append("rect")
      .attr("class", "keySelBoth")
      .attr("x", 40 + channelboxX(0))
      .attr("width", 40)
      .attr("height", 12)
      .attr("opacity", 0)
      .attr("display", "none")
      .on("click", uchl(() => 0));

    s
      .append("g")
      .attr("class", "keySel")
      .attr("transform", p => channelboxTranslate(p.avg))
      .on("click", uchl(p => !p.avg))
      .selectAll()
      .data([0, 80])
      .join("rect")
      .attr("x", d => d)
      .attr("y", -12)
      .attr("width", 40)
      .attr("height", 24)
      .attr("opacity", 0);

    let o = s
      .filter(isMultichannel)
      .selectAll()
      .data(p => [[p, 0], [p, 1]])
      .join("g")
      .attr("class", "keyOnly")
      .attr("transform", pi => "translate(25," + [-6, 6][pi[1]] + ")")
      .on("mouseover", handleKeyOnlyMouseMove)
      .on("mouseout", handleKeyOnlyMouseOut)
      .on("click", pi => updateCurves(pi[0], false, pi[1]));

    o
      .append("rect")
      .attr("x", 0)
      .attr("y", -6)
      .attr("width", 30)
      .attr("height", 12)
      .attr("opacity", 0);

    o
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", "0.28em")
      .attr("text-anchor", "start")
      .attr("font-size", 7.5)
      .text("only");

    s
      .append("text")
      .attr("class", "imbalance")
      .attr("x", 8)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .attr("font-size", 10.5)
      .text("!");

    if (sampnums.length > 1) {
      let a = s.filter(p => !p.isTarget);
      let f = LR.length > 1 ? (n => "all " + n) : (n => n + " samples");
      // let t = a

      a
        .selectAll()
        .data((p) => (
          [
            "AVG", f(Math.floor(p.channels.filter(Boolean).length / LR.length))
          ].map((t, i) => [t, i === +p.samp ? 1 : 0.6])
        ))
        .join("text")
        .attr("class", "keySamp")
        .attr("x", -18.5 - keyLeft)
        .attr("y", (_, i) => 12 * (i - 1 / 2))
        .attr("dy", "0.33em")
        .attr("text-anchor", "start")
        .attr("font-size", 7)
        .attr("opacity", t => t[1])
        .text(t => t[0]);

      a
        .append("rect")
        .attr("x", -19 - keyLeft)
        .attr("y", -12)
        .attr("width", keyLeft ? 16 : 38)
        .attr("height", 24)
        .attr("opacity", 0)
        .on("click", p => updateCurves(p, undefined, p.lr, !p.samp));
    }

    updateKey(s);
  }

  function updateKey(s) {
    s
      .select(".imbalance")
      .attr("display", p => hasImbalance(p) ? null : "none")

    s
      .select(".keySel")
      .attr("display", p => hasImbalance(p) ? null : "none")

    s
      .selectAll(".keyOnly")
      .attr("display", pi => hasImbalance(pi[0]) ? null : "none")

    s
      .selectAll(".keyCLabel")
      .data(p => p.channels)
      .attr("display", c => c ? null : "none")

    s
      .select("g")
      .attr("mask", p => hasChannelSel(p) ? "url(#chmask" + p.id + ")" : null);

    const l = -17 - (keyLeft ? 8 : 0);

    s
      .select("path")
      .attr("d", p => (
        !isMultichannel(p) ? "M" + (15 + keyExt) + " 0H" + l :
          ["M15 -6H9C0 -6,0 0,-9 0H" + l, "M" + l + " 0H-9C0 0,0 6,9 6H15"]
            .filter((_, i) => p.channels[i])
            .reduce((a, b) => a + b.slice(6))
      ));
  }

  function colorPhones() {
    graphBox.updatePaths();
    
    const c = p => p.active ? getDivColor(p.id, true) : null;
    
    select(".graphtool")
      .select("#phones")
      .selectAll("div.phone-item")
      // @ts-ignore
      .style("background", c)
      // @ts-ignore
      .style("border-color", c);
    
    const table = select(".curves")
      .selectAll("tr")
      .filter(p => !p.isTarget)
      // @ts-ignore
      .style("color", c);

    // @ts-ignore
    table
      .select("button")
      .style("background-color", p => getCurveColor(p.id, 0));

    // @ts-ignore
    const channels = table
      .call(s => s.select(".remove").style("background-image", colorBar)
      .select("svg").call(cpCircles))
      .select("td.channels"); // Key line
    
    channels.select("svg").remove();
    channels.append("svg").call(addKey);
  }

  // eslint-disable-next-line no-unused-vars
  function loadFiles(p, callback) {
    // let l = f => d3.text(DIR + f + ".txt").catch(() => null);
    // let f = p.isTarget ? [l(p.fileName)] : merge(LR.map(s => sampnums.map(n => l(p.fileName + " " + s + n))));
    // Promise.all(f).then(function (frs) {
    //   if (!frs.some(f => f !== null)) {
    //     alert("Headphone not found!");
    //   } else {
    //     let ch = frs.map(f => f && equalizer.interp(frequencyValues, tsvParse(f)));
    //     callback(ch);
    //   }
    // });
  }

  function setOffset(p, o) {
    p.offset = +o;
    if (baseline.p === p) { baseline = getBaseline(p); }
    graphBox.updatePaths();
  }

  function addModel(t) {
    t.filter(p => p.fileNames)
      .append("div").attr("class", "variants")
      .call(function (s) {
        s.append("svg").attr("viewBox", "0 -2 10 11")
          .append("path").attr("fill", "currentColor")
          .attr("d", "M1 2L5 6L9 2L8 1L6 3Q5 4 4 3L2 1Z");
      })
      .attr("tabindex", 0) // Make focusable
      .on(
        "focus",
        function (p) {
          if (p.selectInProgress) return;
          p.selectInProgress = true;
          p.vars[p.fileName] = p.rawChannels;
          select(this)
            .on("mousedown", function () {
              // d3.event.preventDefault();
              this.blur();
            })
            .select("path").attr("transform", "translate(0,7)scale(1,-1)");
          let n = select(this.parentElement).select(".phonename");
          n.text("");
          let q = p.copyOf || p,
            o = q.objs || [p],
            active_fns = o.map(v => v.fileName),
            vars = p.fileNames.map((f, i) => {
              let j = active_fns.indexOf(f);
              return j !== -1 ? o[j] :
                { fileName: f, dispName: q.dispNames[i] };
            });
          let d = n.selectAll().data(vars).join("div")
            .attr("class", "variantName").text(v => v.dispName),
            w = max(d.nodes(), d => d.getBoundingClientRect().width);
          d.style("width", w + "px");
          d.filter(v => v.active)
            .style("cursor", "initial")
            .style("color", graphBox.getTextColor)
            .call(setHover, h => p =>
              select(".curves")
                .selectAll("tr")
                .filter(q => q === p)
                .classed("highlight", h)
            );
          let c = n.selectAll().data(vars).join("span")
            .html("&nbsp;+&nbsp;").attr("class", "variantPopout")
            .style("left", (w + 5) + "px")
            .style("display", v => v.active ? "none" : null);
          [d, c].forEach(e => e.transition().style("top", (_, i) => i * 1.3 + "em"));
          d.filter(v => !v.active).on("mousedown", v => Object.assign(p, v));
          c.on("mousedown", function (v) {
            showVariant(q, v);
          });
        }
      )
      .on(
        "blur",
        function endSelect(p) {
          if (document.activeElement === this) return;
          p.selectInProgress = false;
          select(this)
            .on("mousedown", null)
            .select("path").attr("transform", null);
          let n = select(this.parentElement).select(".phonename");
          n.selectAll("div")
            .call(setHover, () => () => null)
            .transition().style("top", 0 + "em").remove()
            .end().then(() => n.text(p => p.dispName));
          changeVariant(p, updateVariant);
          select(".curves").selectAll("tr").classed("highlight", false); // Prevents some glitches
        }
      );

    t.filter(p => p.isTarget).append("span").text(" Target");
  }

  function updatePhoneTable() {
    let c = select(".curves").selectAll("tr").data(activePhones, p => p.fileName);
    c.exit().remove();
    
    let f = c.enter().append("tr");
    let td = () => f.append("td");
    
    // @ts-ignore
    f
      .call(setHover, h => p => graphBox.highlight(p, h))
      .style("color", p => getDivColor(p.id, true));

    td()
      .attr("class", "remove")
      .text("⊗")
      .on("click", removePhone)
      .style("background-image", colorBar)
      .filter(p => !p.isTarget)
      .append("svg")
      .call(addColorPicker);
    
    td().attr("class", "item-line item-target")
      .call(s => (
        s
          .filter(p => !p.isTarget)
          .attr("class", "item-line item-phone")
          .append("span")
          .attr("class", "brand")
          .text(p => p.dispBrand)
      ))
      .call(addModel);
    
    // @ts-ignore
    td()
      .attr("class", "curve-color")
      .append("button")
      .style("background-color", p => getCurveColor(p.id, 0))
      .filter(p => !p.isTarget).call(makeColorPicker);
    
    td()
      .attr("class", "channels")
      .append("svg")
      .call(addKey)

    td()
      .attr("class", "levels")
      .append("input")
      .attr("type", "number")
      .attr("step", "any")
      .attr("value", 0)
      .property("value", p => p.offset)
      .on("change input", function (p) { setOffset(p, +this.value); });
    
    td()
      .attr("class", "button button-baseline")
      .html("<svg viewBox='-170 -120 340 240'><use xlink:href='#baseline-icon'></use></svg>")
      .on("click", p => graphBox.setBaseline(p === baseline.p ? baseline0 : getBaseline(p)));

    function toggleHide(p) {
      let h = p.hide;
      let t = select(".curves").selectAll("tr").filter(q => q === p);
      t.select(".keyLine").on("click", h ? null : toggleHide)
        .selectAll("path,.imbalance").attr("opacity", h ? null : 0.5);
      t.select(".hideIcon").classed("selected", !h);
      graphBox.gpath.selectAll("path").filter(c => c.p === p)
        .attr("opacity", h ? null : 0);
      p.hide = !h;
      if (labelsShown) {
        graphBox.clearLabels();
        graphBox.drawLabels();
      }
    }

    td().attr("class", "button hideIcon")
      .html("<svg viewBox='-2.5 0 19 12'><use xlink:href='#hide-icon'></use></svg>")
      .on("click", toggleHide);

    td().attr("class", "button button-pin")
      .attr("data-pinned", "false")
      .html("<svg viewBox='-135 -100 270 200'><use xlink:href='#pin-icon'></use></svg>")
      .on("click", function (p) {
        if (cantCompare(activePhones.filter(p => p.pin), 1)) return;

        if (p.pin) {
          p.pin = false;
          this.setAttribute("data-pinned", "false");
        } else {
          p.pin = true; nextPN = null;
          this.setAttribute("data-pinned", "true");
        }

        p.pin = true; nextPN = null;
        select(this)
          .text(null).classed("button", false).on("click", null)
          .insert("svg").attr("class", "pinMark")
          .attr("viewBox", "0 0 280 145")
          .insert("path")
          .attr("fill", "none")
          .attr("stroke-width", 30)
          .attr("stroke-linecap", "round")
          .attr("d", "M265 110V25q0 -10 -10 -10H105q-24 0 -48 20l-24 20q-24 20 -2 40l18 15q24 20 42 20h100")
      });
  }

  function removePhone(p) {
    p.active = p.pin = false; nextPN = null;
    setActivePhones(activePhones.filter(q => q.active));
    if (!p.isTarget) {
      let ap = activePhones.filter(p => !p.isTarget);
      if (ap.length === 1) {
        setCurves(ap[0], false);
      }
    }
    graphBox.updatePaths();
    if (baseline.p && !baseline.p.active) { graphBox.setBaseline(baseline0); }
    updatePhoneTable();
    selectAll("#phones div,.target")
      .filter(q => q === (p.copyOf || p))
      .call(setPhoneTr);
    if (config.extraEnabled && config.eqEnabled) {
      // updateEQPhoneSelect(); TODO
    }
  }

  // Scroll list to active phone on init
  function scrollToActive() {
    try {
      let phoneList = document.querySelector('div.scroll#phones'),
        firstActivePhone = document.querySelector('div.phone-item[style*=border]'),
        // @ts-ignore
        offset = firstActivePhone.offsetTop - 26;

      phoneList.scrollTop = offset;
    }
    catch { /* TODO: fixme */ }
  }

  function setAddButton(a) {
    if (a && cantCompare(activePhones)) return false;
    if (addPhoneSet !== a) {
      addPhoneSet = a;
      select(".graphtool")
        .select(".addPhone")
        .classed("selected", a)
        // @ts-ignore
        .classed("locked", addPhoneLock &= a);
    }
    return true;
  }

  function showPhone(phone, exclusive, suppressVariant, trigger) {
    if (phone.isTarget && activePhones.indexOf(phone) !== -1) {
      removePhone(phone);
      return;
    }
    if (addPhoneSet) {
      exclusive = false;
      if (!addPhoneLock || cantCompare(activePhones, 1, null, true)) {
        setAddButton(false);
      }
    }
    let keep = !exclusive ? (() => true)
      : (q => q.copyOf === phone || q.pin || q.isTarget !== phone.isTarget);
    if (cantCompare(activePhones.filter(keep), 0, phone)) return;
    if (!phone.rawChannels) {
      loadFiles(phone, function (ch) {
        if (phone.rawChannels) return;
        phone.rawChannels = ch;
        showPhone(phone, exclusive, suppressVariant, trigger);

        // Scroll to selected
        if (trigger) { scrollToActive(); }

        // Analytics event
        // if (analyticsEnabled) { pushPhoneTag("phone_displayed", phone, trigger); }
      });
      return;
    }

    smoothPhone(phone);

    if (phone.id === undefined) { phone.id = getPhoneNumber(); }
    normalizePhone(phone);
    phone.offset = phone.offset || 0;
    if (exclusive) {
      setActivePhones(activePhones.filter(q => q.active = keep(q)));
      if (baseline.p && !baseline.p.active) graphBox.setBaseline(baseline0, 1);
    }
    if (activePhones.indexOf(phone) === -1 && (suppressVariant || !phone.objs)) {
      let avg = false;
      if (!phone.isTarget) {
        let ap = activePhones.filter(({ isTarget }) => !isTarget);
        avg = ap.length >= 1;
        if (ap.length === 1 && ap[0].activeCurves.length !== 1) {
          setCurves(ap[0], true);
        }
        activePhones.push(phone);
      } else {
        activePhones.unshift(phone);
      }
      phone.active = true;
      setCurves(phone, avg);
    }
    graphBox.updatePaths(trigger);
    updatePhoneTable();
    
    selectAll("#phones .phone-item,.target")
      .filter(({ id }) => id !== undefined)
      .call(setPhoneTr);
    
      //Displays variant pop-up when phone displayed
    if (!suppressVariant && phone.fileNames && !phone.copyOf && window.innerWidth > 1000) {
      // @ts-ignore
      graphBox.table.selectAll("tr").filter(q => q === phone).select(".variants").node().focus();
    } else {
      // @ts-ignore
      document.activeElement.blur();
    }
    if (config.extraEnabled && config.eqEnabled) {
      // updateEQPhoneSelect(); TODO
    }
    if (!phone.isTarget && config.altAugment) {
      // augmentList(phone);
    }
  }

  function setBrand(b, exclusive) {
    let phoneSel = select(".graphtool").select("#phones").selectAll("div.phone-item");
    let incl = currentBrands.indexOf(b) !== -1;
    let hasBrand = (p, b) => p.brand === b || p.collab === b;

    if (exclusive || currentBrands.length === 0) {
      currentBrands.forEach(br => br.active = false);

      if (incl) {
        currentBrands = [];
        phoneSel.style("display", null);
        phoneSel.select("span").text(p => p.fullName);
      } else {
        currentBrands = [b];
        phoneSel.style("display", p => hasBrand(p, b) ? null : "none");
        phoneSel.filter(p => hasBrand(p, b)).select("span").text(p => p.phone);
      }
    } else {
      if (incl) return;
      if (currentBrands.length === 1) {
        phoneSel.select("span").text(p => p.fullName);
      }

      currentBrands.push(b);
      phoneSel.filter(p => hasBrand(p, b)).style("display", null);
    }

    if (!incl) b.active = true;
    // brandSel.classed("active", br => br.active);
  }

  useEffect(() => {
    loadPhonesList();

    console.log(phonesList);

    let brandSel = select(".graphtool")
      .select("#brands")
      .selectAll()
      .data(brands)
      .join("div")
      .text(b => b.name + (b.suffix ? " " + b.suffix : ""))
      .on("mousedown", () => { /* d3.event.preventDefault() */ })
      // .on("click", p => setBrand(p, !d3.event.ctrlKey))
      .on("click", p => setBrand(p, false))
      // .on("auxclick", p => d3.event.button === 1 ? setBrand(p, 0) : 0);
      .on("auxclick", () => 0);

    // let bg = (h, fn) => function (p) {
    //   d3.select(this).style("background", fn(p));
    //   (p.objs || [p]).forEach(q => highlight(q, h));
    // }
    // window.updatePhoneSelect = () => {
    //   doc.select("#phones").selectAll("div.phone-item")
    //     .data(allPhones)
    //     .join((enter) => {
    //       let phoneDiv = enter.append("div")
    //         .attr("class", "phone-item")
    //         .attr("name", p => p.fullName)
    //         .on("mouseover", bg(true, p => getDivColor(p.id === undefined ? nextPhoneNumber() : p.id, true)))
    //         .on("mouseout", bg(false, p => p.id !== undefined ? getDivColor(p.id, p.active) : null))
    //         .on("mousedown", () => d3.event.preventDefault())
    //         .on("click", p => showPhone(p, !d3.event.ctrlKey))
    //         .on("auxclick", p => d3.event.button === 1 ? showPhone(p, 0) : 0);
          
    //       phoneDiv.append("span").text(p => p.fullName);
    //       // Adding the + selection button
    //       phoneDiv.append("div")
    //         .attr("class", "phone-item-add")
    //         .on("click", p => {
    //           d3.event.stopPropagation(); // change to regular event
    //           showPhone(p, 0);
    //         });
    //     });
    // };
    // updatePhoneSelect();

    if (targets) {
      let brandTarget = { name: "Targets", active: false };
      let ph = t => ({
        isTarget: true, brand: brandTarget,
        dispName: t, phone: t, fullName: t + " Target", fileName: t + " Target"
      });
      
      select(".manage")
        .insert("div", ".manageTable")
        .attr("class", "targets collapseTools");

      let l = (text) => s => s.append("div").attr("class", "targetLabel").append("span").text(text);
      let ts = brandTarget.phoneObjs = select(".graphtool")
        .select(".targets")
        .call(l("Targets"))
        .selectAll()
        .data(targets)
        .join("div")
        .call(l(t => t.type))
        .style("flex-grow", t => t.files.length)
        .attr("class", "targetClass")
        .selectAll()
        .data(t => t.files.map(ph))
        .join("div")
        .text(t => t.dispName)
        .attr("class", "target")
        // .on("mousedown", () => d3.event.preventDefault())
        .on("mousedown", () => {})
        // .on("click", p => showPhone(p, !d3.event.ctrlKey))
        .on("click", p => showPhone(p, true))
        // .on("auxclick", p => d3.event.button === 1 ? showPhone(p, 0) : 0)
        .on("auxclick", () => 0)
        .data();

      ts.forEach((t, i) => {
        t.id = i - ts.length;
        if (isInit(t.fileName)) inits.push(t);
      });
    }

    inits.filter(Boolean).map(p => (
      p.copyOf ? showVariant(p.copyOf, p, initMode) : showPhone(p, 0, 1, initMode)
    ));

    // let phoneSearch = new Fuse(
    //     allPhones,
    //     {
    //         shouldSort: false,
    //         tokenize: true,
    //         threshold: 0.2,
    //         minMatchCharLength: 2,
    //         keys: [
    //             {weight:0.3, name:"dispBrand"},
    //             {weight:0.1, name:"brand.suffix"},
    //             {weight:0.6, name:"phone"}
    //         ]
    //     }
    // );
    // let brandSearch = new Fuse(
    //     brands,
    //     {
    //         shouldSort: false,
    //         tokenize: true,
    //         threshold: 0.05,
    //         minMatchCharLength: 3,
    //         keys: [
    //             {weight:0.9, name:"name"},
    //             {weight:0.1, name:"suffix"},
    //         ]
    //     }
    // );

    // select(".graphtool").select(".search").on("input", function () {
    //     let fn, bl = brands;
    //     let c = currentBrands;
    //     let test = p => c.indexOf(p.brand )!==-1
    //                  || c.indexOf(p.collab)!==-1;
    //     if (this.value.length > 1) {
    //         let s = phoneSearch.search(this.value),
    //             t = c.length ? s.filter(test) : s;
    //         if (t.length) s = t;
    //         fn = p => s.indexOf(p)!==-1;
    //         let b = brandSearch.search(this.value);
    //         if (b.length) bl = b;
    //     } else {
    //         fn = c.length ? test : (p=>true);
    //     }
    //     let phoneSel = select(".graphtool").select("#phones").selectAll("div.phone-item");
    //     phoneSel.style("display", p => fn(p)?null:"none");
    //     brandSel.style("display", b => bl.indexOf(b)!==-1?null:"none");
    // });

    select(".graphtool")
      .select(".addPhone")
      .selectAll("td")
      .on("click", () => setAddButton(!addPhoneSet));

    select(".graphtool")
      .select(".addLock")
      .on("click", function () {
        // d3.event.preventDefault();
        let on = !addPhoneLock;
        if (!setAddButton(on)) return;
        if (on) {
          select(".graphtool").select(".addPhone").classed("locked", addPhoneLock = true);
        }
      });
    
    norms.classed("selected", (_, i) => i === normalizationIndex);

    norms
      .select("input")
      .on("change input", setNorm)
      .on("keypress", function (_, i) {
        // if (d3.event.key === "Enter") { setNorm.bind(this)(_, i); }
        setNorm.bind(this)(_, i);
      });

    norms
      .select("span")
      .on("click", (_, i) => setNorm(_, i, false));

    select(".graphtool")
      .select("#smooth-level")
      .on("change input", function () {
        // @ts-ignore
        if (!this.checkValidity()) return;
        
        // @ts-ignore
        setSmoothLevel((prev) => prev + this.value);

        smoothener.smoothParams = {};
        
        graphBox.line.curve(smoothLevel ? curveNatural : curveCardinal.tension(0.5));
        
        activePhones.forEach(smoothPhone);

        graphBox.updatePaths();
      });

    select(".graphtool").select("#recolor").on("click", function () {
      allPhones.forEach(p => { if (!p.isTarget) { delete p.id; } });
      phoneNumber = 0; nextPN = null;
      activePhones.forEach(p => { if (!p.isTarget) { p.id = getPhoneNumber(); } });
      colorPhones();
    });
  
  }, []);

  return {
    phonesList,
  }
}

export default usePhones;