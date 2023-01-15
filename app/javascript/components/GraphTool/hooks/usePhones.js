import { useEffect, useState } from 'react';
import axios from 'axios';

import Normalizer from 'lib/normalizer';
import Smoothener from 'lib/smoothener';

import frToIndex from "helpers/frToIndex";
import getCurveColor from 'helpers/getCurveColor';
import { phoneOffset } from 'helpers/phone';

import isMultichannel from '../helpers/isMultichannel';
import avgCurves from '../helpers/avgCurves';
import getAverage from '../helpers/getAverage';
import buildFrequencyValues from '../helpers/buildFrequencyValues';

import { LD_P1 } from '../constants';

function usePhones({
  restricted,
  notmalizationType: initialNotmalizationType,
  normalizationHz: initialNormalizationHz,
  normalizationDb: initialNormalizationDb,
}) {
  const [phonesList, setPhonesList] = useState([]);
  const [activePhones, setActivePhones] = useState([]);

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

  let yCenter = 60;
  let phoneNumber = 0; // I'm so sorry it just happened
  // Find a phone id which doesn't have a color conflict with pins
  let nextPN = 0; // Cached value; invalidated when pinned headphones change
  let smoothScale = 0.01 * (typeof scale_smoothing !== "undefined" ? scale_smoothing : 1);

  // const loadPhonesList = () => {
  //   axios
  //     .get('/units.json')
  //     .then(({ data }) => setPhonesList(data));
  // };

  const frequencyValues = buildFrequencyValues();
  const normalizer = new Normalizer();
  const smoothener = new Smoothener({
    smoothLevel,
    smoothScale,
    frequencyValues,
  })

  function normalizePhone(phone) {
    if (normalizationIndex === 1) { // fr
      let i = frToIndex(normalizationHz, frequencyValues);
      let avg = l => 20 * Math.log10(d3.mean(l, d => Math.pow(10, d / 20)));
      
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

  function highlight(p, h) {
    gpath.selectAll("path").filter(c => c.p === p).classed("highlight", h);
  }

  function nextPhoneNumber() {
    if (nextPN === null) {
      nextPN = phoneNumber;
      let pin = activePhones.filter(p => p.pin).map(p => p.id);
      if (pin.length) {
        let p3 = LD_P1 * LD_P1 * LD_P1,
          l = a => b => Math.abs(((a - b) / p3 + 0.5) % 1 - 0.5),
          d = id => d3.min(pin, l(id));
        for (let i = nextPN, max = d(i); max < 0.12 && ++i < phoneNumber + 3;) {
          let m = d(i);
          if (m > max) { max = m; nextPN = i; }
        }
      }
    }
    return nextPN;
  }

  let targetWindow;

  // See if iframe gets CORS error when interacting with window.top
  try {
    targetWindow = window.location.href.includes('embed') ? window : window.top;
  } catch (error) {
    targetWindow = window;
    console.error(error);
  }

  let baseTitle = typeof page_title !== "undefined" ? page_title : "CrinGraph";
  let baseDescription = typeof page_description !== "undefined" ? page_description : "View and compare frequency response graphs";
  let baseURL;  // Set by setInitPhones

  function addPhonesToUrl() {
    let title = baseTitle,
      url = baseURL,
      names = activePhones.filter(p => !p.isDynamic).map(p => p.fileName),
      namesCombined = names.join(", ");

    if (names.length) {
      url += "?share=" + encodeURI(names.join().replace(/ /g, "_"));
      title = namesCombined + " - " + title;
    }
    if (names.length === 1) {
      targetWindow.document.querySelector("link[rel='canonical']").setAttribute("href", url)
    } else {
      targetWindow.document.querySelector("link[rel='canonical']").setAttribute("href", baseURL)
    }
    targetWindow.history.replaceState("", title, url);
    targetWindow.document.title = title;
    targetWindow.document.querySelector("meta[name='description']").setAttribute("content", baseDescription + ", including " + namesCombined + ".");
  }

  function getPhoneNumber() {
    let pn = nextPhoneNumber();
    phoneNumber = pn + 1;
    nextPN = null;
    return pn;
  }

  function updateYCenter() {
    let c = yCenter;
    yCenter = baseline.p ? 0 : normalizationIndex ? 60 : normalizationDb;
    y.domain(y.domain().map(d => d + (yCenter - c)));
    yAxisObj.call(fmtY);
  }



  function getBaseline(p) {
    let b = getAverage(p).map(d => d[1] + phoneOffset(p));
    return { p: p, fn: l => l.map((e, i) => [e[0], e[1] - b[Math.min(i, b.length - 1)]]) };
  }


  function updatePaths(trigger) {
    clearLabels();
    let c = d3.merge(activePhones.map(p => p.activeCurves)),
      p = gpath.selectAll("path").data(c, d => d.id);
    let t = p.join("path").attr("opacity", c => c.p.hide ? 0 : null)
      .classed("sample", c => c.p.samp)
      .attr("stroke", getColor_AC).call(redrawLine)
      .filter(c => c.p.isTarget)
      .attr("class", "target");
    if (targetDashed) t.style("stroke-dasharray", "6, 3");
    if (targetColorCustom) t.attr("stroke", targetColorCustom);
    if (config.shareUrl && !trigger) addPhonesToUrl();
    if (config.stickyLabels) drawLabels();
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
    updateYCenter();
    updatePaths();
  }

  let channelbox_x = c => c ? -86 : -36,
    channelbox_tr = c => "translate(" + channelbox_x(c) + ",0)";

  function setCurves(p, avg, lr, samp) {
    if (avg === undefined) avg = p.avg;
    if (samp === undefined) samp = avg ? false : LR.length === 1 || p.ssamp || false;
    else { p.ssamp = samp; if (samp) avg = false; }
    let dx = +avg - +p.avg,
      n = sampnums.length,
      selCh = (l, i) => l.slice(i * n, (i + 1) * n);
    p.avg = avg;
    p.samp = samp = n > 1 && samp;
    if (!p.isTarget) {
      let id = getChannelName(p),
        v = cs => cs.filter(c => c !== null),
        cs = p.channels,
        cv = v(cs),
        mc = cv.length > 1,
        pc = (idstr, l, oi) => ({
          id: id(idstr), l: l, p: p,
          o: oi === undefined ? 0 : getO(oi)
        });
      p.activeCurves
        = avg && mc ? [pc("AVG", avgCurves(cv))]
          : !samp && mc ? LR.map((l, i) => pc(l, avgCurves(v(selCh(cs, i))), i))
            : cs.map((l, i) => {
              let j = Math.floor(i / n);
              return pc(LR[j] + sampnums[i % n], l, j);
            }).filter(c => c.l);
    } else {
      p.activeCurves = [{ id: p.fullName, l: p.channels[0], p: p, o: 0 }];
    }
    let y = 0;
    let k = d3.selectAll(".keyLine").filter(q => q === p);
    let ksb = k.select(".keySelBoth").attr("display", "none");
    p.lr = lr;
    if (lr !== undefined) {
      p.activeCurves = p.samp ? selCh(p.activeCurves, lr) : [p.activeCurves[lr]];
      y = [-1, 1][lr];
      ksb.attr("display", null).attr("y", [0, -12][lr]);
    }
    k.select(".keyMask")
      .transition().duration(400)
      .attr("x", channelbox_x(avg))
      .attrTween("y", function () {
        let y0 = +this.getAttribute("y"),
          y1 = 12 * (-1 + y);
        if (!dx) { return d3.interpolateNumber(y0, y1); }
        let ym = y0 + (y1 - y0) * (3 - 2 * dx) / 6;
        y0 -= ym; y1 -= ym;
        return t => { t -= 1 / 2; return ym + (t < 0 ? y0 : y1) * Math.pow(2, 20 * (Math.abs(t) - 1 / 2)); };
      });
    k.select(".keySel").attr("transform", channelbox_tr(avg));
    k.selectAll(".keySamp").attr("opacity", (_, i) => i === +samp ? 1 : 0.6);
  }

  function updateCurves() {
    setCurves.apply(null, arguments);
    updatePaths();
  }

  function getDivColor(id, active) {
    let c = getCurveColor(id, 0);
    c.l = 100 - (80 - Math.min(c.l, 60)) / (active ? 1.5 : 3);
    c.c = (c.c - 20) / (active ? 3 : 4);
    return c;
  }

  let getTextColor = p => color_curveToText(getCurveColor(p.id, 0));
  let getBgColor = p => {
    let c = getCurveColor(p.id, 0).rgb();
    ['r', 'g', 'b'].forEach(p => c[p] = 255 - (255 - Math.max(0, c[p])) * 0.85);
    return c;
  }

  let colorBar = p => 'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 8"><path d="M0 8v-8h1c0.05 1.5,-0.3 3,-0.16 5s0.1 2,0.15 3z" fill="' + getBgColor(p) + '"/></svg>\')';

  function setHover(elt, h) {
    elt.on("mouseover", h(true)).on("mouseout", h(false));
  }

  let numChannels = ({ channels }) => channels.filter(Boolean).length;
  let hasChannelSel = p => isMultichannel(p) && numChannels(p) > 1;

  const hasImbalance = (p) => {
    if (!hasChannelSel(p)) return false;
    let as = p.channels[0], bs = p.channels[1];
    let s0 = 0, s1 = 0;
    return as.some((a, i) => {
      let d = a[1] - bs[i][1];
      d *= 1 / (50 * Math.sqrt(1 + Math.pow(a[0] / 1e4, 6)));
      s0 = Math.max(s0 + d, 0);
      s1 = Math.max(s1 - d, 0);
      return Math.max(s0, s1) > config.maxChannelImbalance;
    });
  }

  function updateKey(s) {
    let disp = fn => e => e.attr("display", p => fn(p) ? null : "none"),
      cs = hasChannelSel;
    s.select(".imbalance").call(disp(hasImbalance));
    s.select(".keySel").call(disp(p => cs(p)));
    s.selectAll(".keyOnly").call(disp(pi => cs(pi[0])));
    s.selectAll(".keyCLabel").data(p => p.channels).call(disp(c => c));
    s.select("g").attr("mask", p => cs(p) ? "url(#chmask" + p.id + ")" : null);
    let l = -17 - (keyLeft ? 8 : 0);
    s.select("path").attr("d", p => (
      !isMultichannel(p) ? "M" + (15 + keyExt) + " 0H" + l :
        ["M15 -6H9C0 -6,0 0,-9 0H" + l, "M" + l + " 0H-9C0 0,0 6,9 6H15"]
          .filter((_, i) => p.channels[i])
          .reduce((a, b) => a + b.slice(6))
    ));
  }

  function addKey(s) {
    let dim = { x: -19 - keyLeft, y: -12, width: 65 + keyLeft, height: 24 }
    s.attr("class", "keyLine").attr("viewBox", [dim.x, dim.y, dim.width, dim.height].join(" "));
    let defs = s.append("defs");
    defs.append("linearGradient").attr("id", p => "chgrad" + p.id)
      .attrs({ x1: 0, y1: 0, x2: 0, y2: 1 })
      .selectAll().data(p => [0.1, 0.4, 0.6, 0.9].map(o =>
        [o, getCurveColor(p.id, o < 0.3 ? -1 : o < 0.7 ? 0 : 1)]
      )).join("stop")
      .attr("offset", i => i[0])
      .attr("stop-color", i => i[1]);
    defs.append("linearGradient").attr("id", "blgrad")
      .selectAll().data([0, 0.25, 0.31, 0.69, 0.75, 1]).join("stop")
      .attr("offset", o => o)
      .attr("stop-color", (o, i) => i == 2 || i == 3 ? "white" : "#333");
    let m = defs.append("mask").attr("id", p => "chmask" + p.id);
    m.append("rect").attrs(dim).attr("fill", "#333");
    m.append("rect").attrs({ "class": "keyMask", x: p => channelbox_x(p.avg), y: -12, width: 120, height: 24, fill: "url(#blgrad)" });
    let t = s.append("g");
    t.append("path")
      .attr("stroke", p => isMultichannel(p) ? "url(#chgrad" + p.id + ")" : getCurveColor(p.id, 0));
    t.selectAll().data(p => p.isTarget ? [] : LR)
      .join("text").attr("class", "keyCLabel")
      .attrs({
        x: 17 + keyExt, y: (_, i) => 12 * (i - (LR.length - 1) / 2),
        dy: "0.32em", "text-anchor": "start", "font-size": 10.5
      })
      .text(t => t);
    t.filter(p => p.isTarget).append("text")
      .attrs(keyExt ? { x: 7, y: 6, "text-anchor": "middle" }
        : { x: 17, y: 0, "text-anchor": "start" })
      .attrs({ dy: "0.32em", "font-size": 8, fill: p => getCurveColor(p.id, 0) })
      .text("Target");
    let uchl = f => function (p) {
      updateCurves(p, f(p)); highlight(p, true);
    }
    s.append("rect").attr("class", "keySelBoth")
      .attrs({
        x: 40 + channelbox_x(0), width: 40, height: 12,
        opacity: 0, display: "none"
      })
      .on("click", uchl(p => 0));
    s.append("g").attr("class", "keySel")
      .attr("transform", p => channelbox_tr(p.avg))
      .on("click", uchl(p => !p.avg))
      .selectAll().data([0, 80]).join("rect")
      .attrs({ x: d => d, y: -12, width: 40, height: 24, opacity: 0 });
    let o = s
      .filter(isMultichannel)
      .selectAll().data(p => [[p, 0], [p, 1]])
      .join("g").attr("class", "keyOnly")
      .attr("transform", pi => "translate(25," + [-6, 6][pi[1]] + ")")
      .call(setHover, h => function (pi) {
        let p = pi[0], cs = p.activeCurves;
        if (!p.hide && cs.length === 2) {
          d3.event.stopPropagation();
          highlight(p, h ? (c => c === cs[pi[1]]) : true);
          clearLabels();
          gpath.selectAll("path").filter(c => c.p === p).attr("opacity", h ? (c => c !== cs[pi[1]] ? 0.7 : null) : null);
        }
      })
      .on("click", pi => updateCurves(pi[0], false, pi[1]));
    o.append("rect").attrs({ x: 0, y: -6, width: 30, height: 12, opacity: 0 });
    o.append("text").attrs({
      x: 0, y: 0, dy: "0.28em", "text-anchor": "start",
      "font-size": 7.5
    })
      .text("only");
    s.append("text").attr("class", "imbalance")
      .attrs({ x: 8, y: 0, dy: "0.35em", "font-size": 10.5 })
      .text("!");
    if (sampnums.length > 1) {
      let a = s.filter(p => !p.isTarget);
      let f = LR.length > 1 ? (n => "all " + n) : (n => n + " samples");
      let t = a.selectAll()
        .data(p => ["AVG", f(Math.floor(p.channels.filter(Boolean).length / LR.length))]
          .map((t, i) => [t, i === +p.samp ? 1 : 0.6]))
        .join("text").attr("class", "keySamp")
        .attrs({
          x: -18.5 - keyLeft, y: (_, i) => 12 * (i - 1 / 2), dy: "0.33em",
          "text-anchor": "start", "font-size": 7, opacity: t => t[1]
        })
        .text(t => t[0]);
      a.append("rect")
        .attrs({ x: -19 - keyLeft, y: -12, width: keyLeft ? 16 : 38, height: 24, opacity: 0 })
        .on("click", p => updateCurves(p, undefined, p.lr, !p.samp));
    }
    updateKey(s);
  }

  function asPhoneObj(b, p, isInit, inits) {
    if (!isInit) {
      isInit = _ => false;
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
          let reg = new RegExp("^" + p.prefix + "\s*", "i");
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
          c = { copyOf: r };
        });
      }
    }
    r.dispName = r.dispName || r.phone;
    r.fullName = r.dispBrand + " " + r.phone;
    if (alt_augment) {
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
      .on("click", p => { d3.event.stopPropagation(); removeCopies(p); });
  }

  function updateVariant(phone) {
    updateKey(table.selectAll("tr").filter(q => q === phone).select(".keyLine"));
    normalizePhone(phone);
    updatePaths();
  }

  function addModel(t) {
    let n = t.append("div").attr("class", "phonename").text(p => p.dispName);
    t.filter(p => p.fileNames)
      .append("div").attr("class", "variants")
      .call(function (s) {
        s.append("svg").attr("viewBox", "0 -2 10 11")
          .append("path").attr("fill", "currentColor")
          .attr("d", "M1 2L5 6L9 2L8 1L6 3Q5 4 4 3L2 1Z");
      })
      .attr("tabindex", 0) // Make focusable
      .on("focus", function (p) {
        if (p.selectInProgress) return;
        p.selectInProgress = true;
        p.vars[p.fileName] = p.rawChannels;
        d3.select(this)
          .on("mousedown", function () {
            d3.event.preventDefault();
            this.blur();
          })
          .select("path").attr("transform", "translate(0,7)scale(1,-1)");
        let n = d3.select(this.parentElement).select(".phonename");
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
          w = d3.max(d.nodes(), d => d.getBoundingClientRect().width);
        d.style("width", w + "px");
        d.filter(v => v.active)
          .style("cursor", "initial")
          .style("color", getTextColor)
          .call(setHover, h => p =>
            table.selectAll("tr").filter(q => q === p)
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
      })
      .on("blur", function endSelect(p) {
        if (document.activeElement === this) return;
        p.selectInProgress = false;
        d3.select(this)
          .on("mousedown", null)
          .select("path").attr("transform", null);
        let n = d3.select(this.parentElement).select(".phonename");
        n.selectAll("div")
          .call(setHover, h => p => null)
          .transition().style("top", 0 + "em").remove()
          .end().then(() => n.text(p => p.dispName));
        changeVariant(p, updateVariant);
        table.selectAll("tr").classed("highlight", false); // Prevents some glitches
      });
    t.filter(p => p.isTarget).append("span").text(" Target");
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


  let cantCompare;
  let noTargets = typeof disallow_target !== "undefined" && disallow_target;
  if (noTargets || typeof max_compare !== "undefined") {
    const currency = [
      ["$", "#348542"],
      ["¥", "#d11111"],
      ["€", "#2961d4"],
      ["฿", "#dcaf1d"]
    ];
    let currencyCounter = -1,
      lastMessage = null,
      messageWeight = 0;
    let cantTarget = p => false;
    if (noTargets) {
      if (typeof allow_targets === "undefined") {
        cantTarget = p => p.isTarget;
      } else {
        let r = f => f.replace(/ Target$/, ""),
          a = allow_targets.map(r);
        cantTarget = p => p.isTarget && a.indexOf(r(p.fileName)) < 0;
      }
    }
    let ct = typeof restrict_target === "undefined" || restrict_target,
      ccfilter = ct ? (l => l) : (l => l.filter(p => !p.isTarget));
    cantCompare = function (ps, add, p, noMessage) {
      let count = ccfilter(ps).length + (add || 0) - (!ct && p && p.isTarget ? 1 : 0);
      if (count < max_compare && !(p && cantTarget(p))) { return false; }
      if (noMessage) { return true; }
      let div = doc.append("div");
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
        let back = doc.append("div")
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
    }
  } else {
    cantCompare = function (m) { return false; }
  }


  function showVariant(p, c, trigger) {
    if (cantCompare(activePhones)) return;
    if (!p.objs) { p.objs = [p]; }
    p.objs.push(c);
    c.active = true; c.copyOf = p;
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
      d3.event.stopPropagation();
    });
  }

  function colorPhones() {
    updatePaths();
    let c = p => p.active ? getDivColor(p.id, true) : null;
    doc.select("#phones").selectAll("div.phone-item")
      .style("background", c).style("border-color", c);
    let t = table.selectAll("tr").filter(p => !p.isTarget)
      .style("color", c);
    t.select("button").style("background-color", p => getCurveColor(p.id, 0));
    t = t.call(s => s.select(".remove").style("background-image", colorBar)
      .select("svg").call(cpCircles))
      .select("td.channels"); // Key line
    t.select("svg").remove();
    t.append("svg").call(addKey);
  }

  function loadFiles(p, callback) {
    let l = f => d3.text(DIR + f + ".txt").catch(() => null);
    let f = p.isTarget ? [l(p.fileName)]
      : d3.merge(LR.map(s =>
        sampnums.map(n => l(p.fileName + " " + s + n))));
    Promise.all(f).then(function (frs) {
      if (!frs.some(f => f !== null)) {
        alert("Headphone not found!");
      } else {
        let ch = frs.map(f => f && equalizer.interp(frequencyValues, tsvParse(f)));
        callback(ch);
      }
    });
  }


  function setBaseline(b, no_transition) {
    baseline = b;
    updateYCenter();
    if (no_transition) return;
    clearLabels();
    gpath.selectAll("path")
      .transition().duration(500).ease(d3.easeQuad)
      .attr("d", drawLine);
    table.selectAll("tr").select(".button")
      .classed("selected", p => p === baseline.p);

    // Analytics event
    if (analyticsEnabled && b.p) { pushPhoneTag("baseline_set", b.p); }
  }


  function setOffset(p, o) {
    p.offset = +o;
    if (baseline.p === p) { baseline = getBaseline(p); }
    updatePaths();
  }

  function updatePhoneTable() {
    let c = table.selectAll("tr").data(activePhones, p => p.fileName);
    c.exit().remove();
    let f = c.enter().append("tr"),
      td = () => f.append("td");
    f.call(setHover, h => p => highlight(p, h))
      .style("color", p => getDivColor(p.id, true));

    td().attr("class", "remove").text("⊗")
      .on("click", removePhone)
      .style("background-image", colorBar)
      .filter(p => !p.isTarget).append("svg").call(addColorPicker);
    td().attr("class", "item-line item-target")
      .call(s => s.filter(p => !p.isTarget).attr("class", "item-line item-phone")
        .append("span").attr("class", "brand").text(p => p.dispBrand))
      .call(addModel);
    td().attr("class", "curve-color").append("button")
      .style("background-color", p => getCurveColor(p.id, 0))
      .filter(p => !p.isTarget).call(makeColorPicker);
    td().attr("class", "channels").append("svg").call(addKey)
    td().attr("class", "levels").append("input")
      .attrs({ type: "number", step: "any", value: 0 })
      .property("value", p => p.offset)
      .on("change input", function (p) { setOffset(p, +this.value); });
    td().attr("class", "button button-baseline")
      .html("<svg viewBox='-170 -120 340 240'><use xlink:href='#baseline-icon'></use></svg>")
      .on("click", p => setBaseline(p === baseline.p ? baseline0
        : getBaseline(p)));
    function toggleHide(p) {
      let h = p.hide;
      let t = table.selectAll("tr").filter(q => q === p);
      t.select(".keyLine").on("click", h ? null : toggleHide)
        .selectAll("path,.imbalance").attr("opacity", h ? null : 0.5);
      t.select(".hideIcon").classed("selected", !h);
      gpath.selectAll("path").filter(c => c.p === p)
        .attr("opacity", h ? null : 0);
      p.hide = !h;
      if (labelsShown) {
        clearLabels();
        drawLabels();
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
        d3.select(this)
          .text(null).classed("button", false).on("click", null)
          .insert("svg").attr("class", "pinMark")
          .attr("viewBox", "0 0 280 145")
          .insert("path").attrs({
            fill: "none",
            "stroke-width": 30,
            "stroke-linecap": "round",
            d: "M265 110V25q0 -10 -10 -10H105q-24 0 -48 20l-24 20q-24 20 -2 40l18 15q24 20 42 20h100"
          });
      });
  }

  function removePhone(p) {
    p.active = p.pin = false; nextPN = null;
    activePhones = activePhones.filter(q => q.active);
    if (!p.isTarget) {
      let ap = activePhones.filter(p => !p.isTarget);
      if (ap.length === 1) {
        setCurves(ap[0], false);
      }
    }
    updatePaths();
    if (baseline.p && !baseline.p.active) { setBaseline(baseline0); }
    updatePhoneTable();
    d3.selectAll("#phones div,.target")
      .filter(q => q === (p.copyOf || p))
      .call(setPhoneTr);
    if (extraEnabled && extraEQEnabled) {
      updateEQPhoneSelect();
    }
  }

  // Scroll list to active phone on init
  function scrollToActive() {
    try {
      let phoneList = document.querySelector('div.scroll#phones'),
        firstActivePhone = document.querySelector('div.phone-item[style*=border]'),
        offset = firstActivePhone.offsetTop - 26;

      phoneList.scrollTop = offset;
    }
    catch { }
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
    let keep = !exclusive ? (q => true)
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
        if (analyticsEnabled) { pushPhoneTag("phone_displayed", phone, trigger); }
      });
      return;
    }

    smoothPhone(phone);

    if (phone.id === undefined) { phone.id = getPhoneNumber(); }
    normalizePhone(phone);
    phone.offset = phone.offset || 0;
    if (exclusive) {
      activePhones = activePhones.filter(q => q.active = keep(q));
      if (baseline.p && !baseline.p.active) setBaseline(baseline0, 1);
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
    updatePaths(trigger);
    updatePhoneTable();
    d3.selectAll("#phones .phone-item,.target")
      .filter(({ id }) => id !== undefined)
      .call(setPhoneTr);
    
      //Displays variant pop-up when phone displayed
    if (!suppressVariant && phone.fileNames && !phone.copyOf && window.innerWidth > 1000) {
      table.selectAll("tr").filter(q => q === phone).select(".variants").node().focus();
    } else {
      document.activeElement.blur();
    }
    if (extraEnabled && extraEQEnabled) {
      updateEQPhoneSelect();
    }
    if (!phone.isTarget && alt_augment) { augmentList(phone); }
  }

  useEffect(() => {
    loadPhonesList();

    console.log(phonesList);

    let config.shareUrl = typeof share_url !== "undefined" && config.shareUrl;

    let brands = [];
    let brandMap = window.brandMap = {};
    let inits = [];
    let initReq = typeof init_phones !== "undefined" ? init_phones : false;
    let loadFromShare = 0;
    let initMode = "config";

    if (config.shareUrl) {
      let url = targetWindow.location.href;
      let par = "share=";
      let emb = "embed";
      baseURL = url.split("?").shift();

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

    brands.push({ name: "Uploaded", phones: [] });
    brands.forEach(b => brandMap[b.name] = b);
    brands.forEach(function (b) {
      b.active = false;
      b.phoneObjs = b.phones.map(function (p) {
        return asPhoneObj(b, p, isInit, inits);
      });
    });

    let allPhones = window.allPhones = d3.merge(brands.map(b => b.phoneObjs)),
      currentBrands = [];
    if (!initReq) inits.push(allPhones[0]);

    function setClicks(fn) {
      return function (elt) {
        elt.on("mousedown", () => d3.event.preventDefault())
          .on("click", p => fn(p, !d3.event.ctrlKey))
          .on("auxclick", p => d3.event.button === 1 ? fn(p, 0) : 0);
      };
    }

    let brandSel = doc.select("#brands").selectAll()
      .data(brands).join("div")
      .text(b => b.name + (b.suffix ? " " + b.suffix : ""))
      .call(setClicks(setBrand));

    let bg = (h, fn) => function (p) {
      d3.select(this).style("background", fn(p));
      (p.objs || [p]).forEach(q => highlight(q, h));
    }
    window.updatePhoneSelect = () => {
      doc.select("#phones").selectAll("div.phone-item")
        .data(allPhones)
        .join((enter) => {
          let phoneDiv = enter.append("div")
            .attr("class", "phone-item")
            .attr("name", p => p.fullName)
            .on("mouseover", bg(true, p => getDivColor(p.id === undefined ? nextPhoneNumber() : p.id, true)))
            .on("mouseout", bg(false, p => p.id !== undefined ? getDivColor(p.id, p.active) : null))
            .call(setClicks(showPhone));
          phoneDiv.append("span").text(p => p.fullName);
          // Adding the + selection button
          phoneDiv.append("div")
            .attr("class", "phone-item-add")
            .on("click", p => {
              d3.event.stopPropagation();
              showPhone(p, 0);
            });
        });
    };
    updatePhoneSelect();

    if (targets) {
      let b = window.brandTarget = { name: "Targets", active: false },
        ti = -targets.length,
        ph = t => ({
          isTarget: true, brand: b,
          dispName: t, phone: t, fullName: t + " Target", fileName: t + " Target"
        });
      d3.select(".manage").insert("div", ".manageTable")
        .attr("class", "targets collapseTools");
      let l = (text, c) => s => s.append("div").attr("class", "targetLabel").append("span").text(text);
      let ts = b.phoneObjs = doc.select(".targets").call(l("Targets"))
        .selectAll().data(targets).join("div").call(l(t => t.type))
        .style("flex-grow", t => t.files.length).attr("class", "targetClass")
        .selectAll().data(t => t.files.map(ph))
        .join("div").text(t => t.dispName).attr("class", "target")
        .call(setClicks(showPhone))
        .data();
      ts.forEach((t, i) => {
        t.id = i - ts.length;
        if (isInit(t.fileName)) inits.push(t);
      });
    }

    inits.filter(Boolean).map(p => (
      p.copyOf ? showVariant(p.copyOf, p, initMode) : showPhone(p, 0, 1, initMode)
    ));

    function setBrand(b, exclusive) {
      let phoneSel = doc.select("#phones").selectAll("div.phone-item");
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
      brandSel.classed("active", br => br.active);
    }

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

    // doc.select(".search").on("input", function () {
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
    //     let phoneSel = doc.select("#phones").selectAll("div.phone-item");
    //     phoneSel.style("display", p => fn(p)?null:"none");
    //     brandSel.style("display", b => bl.indexOf(b)!==-1?null:"none");
    // });



    let addPhoneSet = false, // Whether add phone button was clicked
      addPhoneLock = false;

    function setAddButton(a) {
      if (a && cantCompare(activePhones)) return false;
      if (addPhoneSet !== a) {
        addPhoneSet = a;
        doc.select(".addPhone").classed("selected", a)
          .classed("locked", addPhoneLock &= a);
      }
      return true;
    }

    doc.select(".addPhone").selectAll("td")
      .on("click", () => setAddButton(!addPhoneSet));
    doc.select(".addLock").on("click", function () {
      d3.event.preventDefault();
      let on = !addPhoneLock;
      if (!setAddButton(on)) return;
      if (on) {
        doc.select(".addPhone").classed("locked", addPhoneLock = true);
      }
    });

    let norms = doc.select(".normalize").selectAll("div");
    
    norms.classed("selected", (_, i) => i === normalizationIndex);

    norms.select("input")
      .on("change input", setNorm)
      .on("keypress", function (_, i) {
        if (d3.event.key === "Enter") { setNorm.bind(this)(_, i); }
      });
    norms.select("span").on("click", (_, i) => setNorm(_, i, false));

    doc.select("#smooth-level").on("change input", function () {
      if (!this.checkValidity()) return;
      
      setSmoothLevel((prev) => prev + this.value);

      smoothener.smoothParams = {};
      
      line.curve(smoothLevel ? d3.curveNatural : d3.curveCardinal.tension(0.5));
      
      activePhones.forEach(smoothPhone);

      updatePaths();
    });

    doc.select("#recolor").on("click", function () {
      allPhones.forEach(p => { if (!p.isTarget) { delete p.id; } });
      phoneNumber = 0; nextPN = null;
      activePhones.forEach(p => { if (!p.isTarget) { p.id = getPhoneNumber(); } });
      colorPhones();
    });
  
  }, []);
}

export default usePhones;