import { saveSvgAsPng, saveSvg } from 'helpers/saveSvgAsPng';
import * as d3 from "d3";

// fixme
import buildFrequencyValues from 'helpers/buildFrequencyValues';
import frToIndex from 'helpers/frToIndex';
import getCurveColor from 'helpers/getCurveColor';
// import avgCurves from 'helpers/avgCurves';
import {
  phoneOffset,
  phoneFullName,
  channelName,
  // isMultichannel,
  // hasChannelSel,
  // hasImbalance,
} from 'helpers/phone';

import VerticalScaler from "./verticalScaler";

import {
  PADDING,
  OUTER_WIDTH,
  OUTER_HEIGHT,
  INNER_WIDTH,
  INNER_HEIGHT,
  Y_EXTREMUMS,
  Y_BOUNDS,
  X_EXTREMUMS,
  X_BOUNDS,
  X_VALUES,
  FADE_WINTH,
  ZOOM_RANGES,
  ZOOM_EDGE_WIDTHS,
} from './constants';
// import addPhonesToUrl from 'helpers/addPhonesToUrl';

const activePhones = [];

// TODO: check all translate for translate3d
class GraphBox {
  constructor(config, yCenter) {
    this.config = config;
    this.yCenter = yCenter;
    
    this.selectedZoomIndex = ZOOM_RANGES.length;
    this.frequencyValues = buildFrequencyValues();
    this.LR = this.config.dualChannel ? ["L", "R"] : [this.config.enabledChannel];
    this.sampnums = this.config.num_samples ? d3.range(1, this.config.num_samples + 1) : [""];
    this.keyExt = this.LR.length === 1 ? 16 : 0;
    this.keyLeft = this.keyExt ? 0 : this.sampnums.length > 1 ? 11 : 0;

    this.doc = d3.select(".graphtool");
    this.graph = this.doc.select("#fr-graph");
    this.defs = this.graph.append("defs");

    this.addBackground();
    this.addYAxis();
    this.addXAxis();
    this.drawPlotLine();
    this.buildVerticalScaler();
    this.addElements();
    this.addEventListeners();
  }

  addBackground() {
    this.graph
      .append("rect")
      .attr("x", 0)
      .attr("y", PADDING.top - 8)
      .attr("width", OUTER_WIDTH)
      .attr("height", OUTER_HEIGHT - 22)
      .attr("rx", 4)
      .attr("class", "graphBackground");

    // watermark(graph);
  }

  addYAxis() {
    this.yScale = d3
      .scaleLinear()
      .domain(Y_EXTREMUMS)
      .range(Y_BOUNDS);

    this.defs
      .append("filter")
      .attr("id", "blur")
      .attr("filterUnits", "userSpaceOnUse")
      .attr("x", -INNER_WIDTH - 4)
      .attr("y", -2)
      .attr("width", INNER_WIDTH + 8)
      .attr("height", 4)
      .append("feGaussianBlur")
      .attr("in", "SourceGraphic")
      .attr("stdDeviation", 0.8);

    this.yAxis = d3
      .axisLeft(this.yScale)
      .tickSize(INNER_WIDTH)
      .tickSizeOuter(0)
      .tickPadding(1);

    this.yAxisObj = this.graph
      .append("g")
      .attr("transform", "translate(" + (PADDING.left + INNER_WIDTH) + ",0)")
      .call(this.fmtY.bind(this))

    this.yAxisObj
      .insert("text")
      .attr("transform", "rotate(-90)")
      .attr("fill", "currentColor")
      .attr("text-anchor", "end")
      .attr("y", -INNER_WIDTH - 2)
      .attr("x", -PADDING.top)
      .text("dB");
  }

  addXAxis() {
    const ticks = [1, 2, 3].map((num) => X_VALUES.map((xValue) => xValue * Math.pow(10, num)));
    const tickFormat = (xValue) => (xValue >= 1000 ? `${xValue / 1000}k` : xValue);
    
    this.xScale = d3
      .scaleLog()
      .domain(X_EXTREMUMS)
      .range(X_BOUNDS);

    // @ts-ignore
    this.xAxis = d3
      .axisBottom(this.xScale)
      .tickSize(INNER_HEIGHT + 3)
      .tickSizeOuter(0)
      .tickValues(d3.merge(ticks).concat([20000]))
      .tickFormat(tickFormat);

    this.defs
      .append("clipPath")
      .attr("id", "x-clip")
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", OUTER_WIDTH)
      .attr("height", OUTER_HEIGHT);

    this.xAxisObj = this.graph
      .append("g")
      .attr("clip-path", "url(#x-clip)")
      .attr("transform", "translate(0," + PADDING.top + ")")
      .call(this.fmtX.bind(this));
  }

  fmtY(axisElement) {
    const d = this.yScale.domain();
    const r = d[1] - d[0];
    const t = r < 40 ? 1 : 5;
    const y0 = Math.ceil(d[0] / t);
    const y1 = Math.floor(d[1] / t);
    const isMinor = (_, i) => (t === 5 ? false : (y0 + i) % 5 !== 0);
    const ticks = d3.range(y1 - y0 + 1).map((i) => t * (y0 + i));

    this.yAxis.tickValues(ticks)(axisElement);

    axisElement
      .select(".domain")
      .remove();

    axisElement
      .selectAll(".tick line")
      .attr("stroke-linecap", "round")
      .attr("filter", (_this, i) => isMinor(_this, i) ? null : "url(#blur)")
      .attr("stroke-width", (_this, i) => isMinor(_this, i) ? 0.2 * (1 - r / 45) : 0.15 * (1 + 45 / r));

    axisElement
      .selectAll(".tick text")
      .attr("text-anchor", "start")
      .attr("x", -INNER_WIDTH + 3)
      .attr("dy", -2)
      .filter(isMinor)
      .attr("display", "none");
  }

  fmtX(axisElement) {
    const tickPattern = [3, 0, 0, 1, 0, 0, 2, 0];
    const getTickType = i => i === 0 || i === 3 * 8 ? 4 : tickPattern[i % 8];
    const tickThickness = [2, 4, 4, 9, 15].map(t => t / 10);

    this.xAxis(axisElement);

    (axisElement.selection ? axisElement.selection() : axisElement)
      .select(".domain")
      .remove();

    axisElement
      .selectAll(".tick line")
      .attr("stroke", "#333")
      .attr("stroke-width", (_, i) => tickThickness[getTickType(i)]);

    axisElement
      .selectAll(".tick text")
      .filter((_, i) => tickPattern[i % 8] === 0)
      .attr("font-size", "86%")
      .attr("font-weight", "lighter");

    axisElement
      .select(".tick:last-of-type text")
      .attr("dx", -5)
      .text("20kHz");

    axisElement
      .select(".tick:first-of-type text")
      .attr("dx", 4)
      .text("20Hz");
  }

  drawPlotLine() {
    this.defs
      .selectAll()
      .data([0, 1])
      .join("linearGradient")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 1)
      .attr("y2", 0)
      .attr("id", i => "grad" + i)
      .selectAll()
      .data(i => [i, 1 - i])
      .join("stop")
      .attr("offset", (_, i) => i)
      .attr("stop-color", j => ["black", "white"][j]);

    let fade = this.defs
      .append("mask")
      .attr("id", "graphFade")
      .attr("maskUnits", "userSpaceOnUse")
      .append("g")
      .attr("transform", `translate(${PADDING.left}, ${PADDING.top})`);

    fade
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", INNER_WIDTH)
      .attr("height", INNER_HEIGHT)
      .attr("fill", "white");

    this.fadeEdge = fade
      .selectAll()
      .data([0, 1])
      .join("rect")
      .attr("x", (i) => i ? INNER_WIDTH - FADE_WINTH : 0)
      .attr("width", FADE_WINTH)
      .attr("y", 0)
      .attr("height", INNER_HEIGHT)
      .attr("fill", (i) => `url(#grad${i})`); // TODO: check for (d,i)=>

    this.line = d3
      .line()
      .x(d => this.xScale(d[0]))
      .y(d => this.yScale(d[1]))
      .curve(d3.curveNatural);
  }

  // TODO: move to hooks
  // let rangeSel = doc.select(".zoom").selectAll("button");
  // rangeSel.on("click", zoomToRange)
  // rangeSel.classed("selected", (_, j) => j === s);
  zoomToRange(newIndex) {
    let prevIndex = this.selectedZoomIndex;
    
    this.selectedZoomIndex = prevIndex === newIndex ? ZOOM_RANGES.length : newIndex;
    this.xScale.domain(ZOOM_RANGES[this.selectedZoomIndex]);
    
    // More time to go between bass and treble
    const bassToTreble = Math.min(prevIndex, newIndex) === 0 && Math.max(prevIndex, newIndex) === 2;
    const duration = bassToTreble ? 1100 : 700;

    this.clearLabels();

    this.gpath
      .selectAll("path")
      .transition()
      .duration(duration)
      .attr("d", this.drawLine);

    const edgeWidth = ZOOM_EDGE_WIDTHS[this.selectedZoomIndex];

    this.fadeEdge
      .transition()
      .duration(duration)
      .attr("x", (i) => i ? INNER_WIDTH - edgeWidth[i] : 0)
      .attr("width", (i) => edgeWidth[i]);

    this.xAxisObj
      .transition()
      .duration(duration)
      .call(this.fmtX.bind(this));
  }

  buildVerticalScaler() {
    this.verticalScaler = new VerticalScaler({
      h: 15,
      min: PADDING.top,
      max: PADDING.top + INNER_HEIGHT,
      y: this.yScale(60),
      H: this.yScale(60) - this.yScale(70),
      left: PADDING.left,
      graph: this.graph,
      onChange: this.handleChanheScale,
    });
  }

  handleChanheScale(scale) {
    const diff = (array) => array[1] - array[0];
    const yDomainValues = Y_BOUNDS.map((y) => (
      this.yCenter + (y - scale.y) * (15 / scale.h) * diff(Y_EXTREMUMS) / diff(Y_BOUNDS)
    ));

    this.yScale.domain(yDomainValues);
    this.yAxisObj.call(this.fmtY.bind(this));

    this.clearLabels();
    this.gpath.selectAll("path").call(this.redrawLine.bind(this));
  }


  clearLabels() {
    this.graph.selectAll(".lineLabel").remove();
  }

  getO(i) {
    if (!this.config.dualChannel) return 0;

    return i * 2 / (this.LR.length - 1) - 1;
  }

  // TODO: consider refactoring
  // need to receive label names
  drawLabels() {
    if (this.keyLeft) d3.select(".key").style("width", "17%")

    // TODO: move activePhones outside
    let curves = d3.merge(
      activePhones.filter(p => !p.hide).map(p =>
        p.isTarget || !p.samp || p.avg ? p.activeCurves
          : this.LR.map((l, i) => ({
            p: p, o: this.getO(i), id: channelName(p, l), multi: true,
            l: (n => p.channels.slice(i * n, (i + 1) * n))(this.sampnums.length)
              .filter(c => c !== null)
          }))
      )
    );

    if (!curves.length) return;

    let bcurves = curves.slice();
    let bp = this.baseline.p;

    if (bp && bp.hide) {
      bcurves.push({
        p: bp, o: 0,
        id: "Baseline: " + (bp.isTarget ? bp.fullName : phoneFullName(bp))
      });
    }

    this.graph.selectAll(".lineLabel").remove();

    let g = this.graph
      .selectAll(".lineLabel")
      .data(bcurves)
      .join("g")
      .attr("class", "lineLabel")
      .attr("opacity", 0);

    // TODO: try use node().getBBox();
    // @ts-ignore
    g.datum(function () { return this.getBBox(); });

    g
      .select("text")
      .attr("x", (b) => 3 - b.x)
      .attr("y", (b) => 3 - b.y);

    g
      .insert("rect", "text")
      .attr("x", 2)
      .attr("y", 2)
      .attr("width", (b) => b.width + 2)
      .attr("height", (b) => b.height + 2);

    let boxes = g.data();
    let w = boxes.map(b => b.width + 6);
    let h = boxes.map(b => b.height + 6);

    // Slice to fit in range
    let r = this.xScale.domain().map(v => d3.bisectLeft(this.frequencyValues, v));
    const rsl = a => a.slice(Math.max(r[0], 0), r[1] + 1);
    let rf_values = rsl(this.frequencyValues);
    let v = curves.map(c => {
      let o = phoneOffset(c.p);

      return (c.multi ? c.l : [c.l]).map(l => rsl(this.baseline.fn(l).map(d => d[1] + o)));
    });

    let tr;

    if (curves.length === 1) {
      let x0 = 50, y0 = 10,
        sl = this.rangeToSlice([0, w[0]], o => x0 + o),
        e = d3.extent(d3.merge(v[0].map(sl)).map(this.yScale));
      if (y0 + h[0] >= e[0]) { y0 = Math.max(y0, e[1]); }
      tr = [[x0, y0]];
    } else {
      let n = v.length;
      let invd = (sc, d) => sc.invert(d) - sc.invert(0);
      let xr = this.xScale.range();
      // let yd = this.yScale.domain();
      let wind = w => Math.ceil((w / (xr[1] - xr[0])) * rf_values.length);
      let mw = wind(d3.min(w));
      let winReduce = (l, w, d0, fn) => {
        l = l.slice();
        for (let d = d0; d < w;) {
          let diff = Math.min(2 * d, w) - d;
          for (let i = 0; i < l.length - diff; i++) {
            l[i] = fn(l[i], l[i + diff]);
          }
          d += diff;
        }
        l.length -= w - d0;
        return l;
      }
      let rangeGetters = [Math.min, Math.max].map(f => {
        let r = c => c.reduce((a, b) => a.map((ai, i) => f(ai, b[i])));
        let t = v.map(c => winReduce(r(c), mw, 1, f));
        return w => t.map(c => winReduce(c, w, mw, f));
      });
      let top = 0; // Use top left if we can't find a spot
      tr = v.map((_, j) => {
        let we = wind(w[j]),
          he = -invd(this.yScale, h[j]),
          range = d3.transpose(rangeGetters.map(r => r(we))),
          ds;
        ds = range[j].map(function (r, ri) {
          let le = r.length,
            s = [[-he, 0], [0, he]][ri].map(o => r.map(d => d + o)),
            d = r.map(() => 1e10);
          for (let k = 0; k < n; k++) if (k !== j) {
            let t = range[k];
            for (let i = 0; i < le; i++) {
              d[i] = Math.min(d[i], Math.max(s[0][i] - t[1][i],
                t[0][i] - s[1][i]));
            }
          }
          return d;
        });
        let sep = 0, pos = null;
        ds.forEach(function (drow, k) {
          for (let ii = 0; ii < drow.length;) {
            let i = ii, d = drow[i],
              rjk = range[j][k], m = rjk[i];
            while (ii++, ii < drow.length && rjk[ii] === m) {
              let di = drow[ii];
              if (di < d && di < 1) break;
              d = Math.max(d, drow[ii]);
            }
            let clip = x => x / Math.sqrt(1 + x * x);
            d = 4 * clip(d / 4) + clip((ii - i) / 3);
            i = Math.floor((i + ii) / 2);
            let dl = drow.length,
              r = i / dl;
            d *= Math.sqrt((0.8 + r) * Math.sqrt(1 - r));
            d *= clip(0.2 + Math.max(0, (i >= 15 ? drow[i - 15] : 0) + (i < dl - 15 ? drow[i + 15] : 0)));
            if (d > sep) {
              let dy = range[j][k][i] + (k ? he : 0),
                yd = this.yScale.domain();
              if (yd[0] + he <= dy && dy <= yd[1]) { sep = d; pos = [i, dy]; }
            }
          }
        });
        return pos ? [this.xScale(rf_values[pos[0]]), this.yScale(pos[1])]
          : [60, 20 + 30 * top++];
      });
    }
    for (let j = curves.length; j < bcurves.length; j++) {
      tr.push([PADDING.left + (INNER_WIDTH - w[j]) / 2, PADDING.top + INNER_HEIGHT - h[j] + 2]);
    }
    g.attr("transform", (_, i) => "translate(" + tr[i].join(",") + ")");
    g.attr("opacity", null);
  }

  saveGraph(ext) {
    const saver = { png: saveSvgAsPng, svg: saveSvg }[ext];
    const showControls = s => this.verticalScaler.outerBox.attr("visibility", s ? null : "hidden");
    
    this.gpath.selectAll("path").classed("highlight", false);
    this.drawLabels();
    
    showControls(false);

    saver(
      this.graph.node(),
      `graph.${ext}`,
      { scale: 3 }
    ).then(() => showControls(true));

    // Analytics event
    // if (analyticsEnabled) { pushEventTag("clicked_download", targetWindow); }
  }

  // TODO: move to hooks
  // doc
  //   .select("#download")
  //   .on("click", () => saveGraph("png"))
  //   .on("contextmenu", function () {
  //     d3.event.returnValue = false;
  //     let b = d3.select(this);
  //     let choice = b
  //       .selectAll("div")
  //       .data(["png", "svg"])
  //       .join("div")
  //       .styles({
  //         position: "absolute", left: 0, top: (_, i) => i * 1.3 + "em",
  //         background: "inherit", PADDING: "0.1em 1em"
  //       })
  //       .text(d => "As ." + d)
  //       .on("click", function (d) {
  //         saveGraph(d);
  //         choice.remove();
  //         d3.event.stopPropagation();
  //       });
  //     b.on("blur", () => choice.remove());
  //   });

  // File loading and channel management

  // TODO: rename
  addElements() {
    this.baseline = { p: null, l: null, fn: l => l };

    this.gpath = this.graph
      .insert("g", ".dBScaler")
      .attr("fill", "none")
      .attr("stroke-width", 2.3)
      .attr("mask", "url(#graphFade)");

    this.table = this.doc.select(".curves"); // TODO: move table interaction outside
  }

  curveColorToText(color) {
    if (!this.config.altLayout) {
      color.l = color.l / 5 + 10;
      color.c /= 3;
    }

    return color;
  }

  getTextColor(phone, o = 0) {
    const curveColor = getCurveColor(phone.id, o);

    return this.curveColorToText(curveColor);
  }

  drawLine(d) {
    return this.line(this.baseline.fn(d.l));
  }

  redrawLine(p) {
    let getTr = o => o ? "translate(0," + (this.yScale(o) - this.yScale(0)) + ")" : null;

    p
      .attr("transform", c => getTr(phoneOffset(c.p)))
      .attr("d", this.drawLine);
  }

  rangeToSlice(xs, fn) {
    let r = xs.map(v => d3.bisectLeft(this.frequencyValues, this.xScale.invert(fn(v))));

    return a => a.slice(Math.max(r[0], 0), r[1] + 1);
  }

  pathHL(c, m, imm) {
    let pathHoverTimeout;

    this.gpath.selectAll("path").classed("highlight", d => c ? d === c : false);
    this.table.selectAll("tr").classed("highlight", p => c ? p === c.p : false);
    
    if (pathHoverTimeout) { clearTimeout(pathHoverTimeout); }
    if (!this.config.stickyLabels) {
      this.clearLabels();
      pathHoverTimeout = imm ? this.pathTooltip(c, m) : (
        c ? setTimeout(this.pathTooltip, 400, c, m) : undefined
      );
    }
  }

  pathTooltip(c, m) {
    const g = this.graph
      .selectAll(".lineLabel")
      .data([c.id])
      .join("g")
      .attr("class", "lineLabel");

    const t = g
      .append("text")
      .attr("x", m[0])
      .attr("y", m[1] - 6)
      .attr("fill", this.getTextColor(c.p, c.o))
      .text(t => t);

    const b = t.node().getBBox();
    const o = PADDING.left + INNER_WIDTH - b.width;

    if (o < b.x) { t.attr("x", o); b.x = o; }

    // Background
    g
      .insert("rect", "text")
      .attr("x", b.x - 1)
      .attr("y", b.y - 1)
      .attr("width", b.width + 2)
      .attr("height", b.height + 2);
  }

  initInspect(element) {
    element.attr("class", "inspector");

    element
      .append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", PADDING.top)
      .attr("y2", PADDING.top + INNER_HEIGHT);

    element
      .append("text")
      .attr("class", "insp_dB")
      .attr("x", 2);
  }

  newTooltip(tooltip) {
    tooltip
      .attr("class", "lineLabel")
      .attr("fill", (d) => this.getTextColor(d.p, d.o));

    tooltip
      .append("text")
      .attr("x", 2)
      .text(d => d.id);

    tooltip
      .append("g")
      .selectAll()
      .data([0, 1])
      .join("text")
      .attr("x", -16)
      .attr("text-anchor", i => i ? "start" : "end");

    tooltip.datum(function () { return this.getBBox(); });

    tooltip
      .insert("rect", "text")
      .attr("x", (b) => b.x - 1)
      .attr("y", (b) => b.y - 1)
      .attr("width", (b) => b.width + 2)
      .attr("height", (b) => b.height + 2);
  }

  // TODO: use it outside
  setInpectMode(mode) {
    this.interactInspect = mode;
  }

  handleMouseMove(imm) {
    let cs = d3.merge(activePhones.map(p => p.hide ? [] : p.activeCurves));
    if (!cs.length) return;
    // @ts-ignore
    let m = d3.mouse(this);

    if (this.interactInspect) {
      let ind = frToIndex(this.xScale.invert(m[0]), this.frequencyValues);
      let x1 = this.xScale(this.frequencyValues[ind]);
      let x0 = ind > 0 ? this.xScale(this.frequencyValues[ind - 1]) : x1;
      let sel = m[0] - x0 < x1 - m[0];
      let xv = sel ? x0 : x1;

      // @ts-ignore
      ind -= sel; // ????

      let insp = this.graph
        .selectAll(".inspector")
        .data([xv])
        .join(enter => enter.append("g").call(this.initInspect))
        .attr("transform", xv => "translate(" + xv + ",0)");

      let dB = insp.select(".insp_dB").text(this.frequencyValues[ind] + " Hz");
      let cy = cs.map(c => [c, this.baseline.fn(c.l)[ind][1] + phoneOffset(c.p)]);

      cy.sort((d, e) => d[1] - e[1]);

      let tt = insp
        .selectAll(".lineLabel")
        .data(cy.map(d => d[0]), d => d.id)
        .join(enter => enter.insert("g", "line").call(this.newTooltip.bind(this)));

      let start = tt
        .select("g")
        .datum((_, i) => cy[i][1])
        .selectAll("text")
        .data(d => {
          let s = d < -0.05 ? "-" : ""; d = Math.abs(d) + 0.05;
          return [s + Math.floor(d) + ".", Math.floor((d % 1) * 10)];
        })
        .text(t => t)
        .filter((_, i) => i === 0)
        .nodes()
        // @ts-ignore
        .map(n => n.getBBox().x - 2); // TODO: try node()

      tt
        .select("rect")
        .attr("x", (b, i) => b.x + start[i] - 1)
        .attr("width", (b, i) => b.width - start[i] + 2);

      // Now compute heights
      let hm = d3.max(tt.data().map(b => b.height));
      let hh = (this.yScale.invert(0) - this.yScale.invert(hm - 1)) / 2;
      let stack = [];

      cy.map(d => d[1]).forEach(function (h) {
        let n = 1;
        let overlap = s => h / n - s.h / s.n <= hh * (s.n + n);
        let l = stack.length;
        while (l && overlap(stack[--l])) {
          let s = stack.pop();
          h += s.h; n += s.n;
        }
        stack.push({ h: h, n: n });
      });

      let ch = d3.merge(stack.map((s) => {
        let h = s.h / s.n - (s.n - 1) * hh;
        return d3.range(s.n).map(k => h + k * 2 * hh);
      }));

      tt.attr("transform", (_, i) => "translate(0," + (this.yScale(ch[i]) + 5) + ")");
      dB.attr("y", this.yScale(ch[ch.length - 1] + 2 * hh) + 1);
    } else {
      // @ts-ignore
      let d = 30 * OUTER_WIDTH / this.graph.node().getBoundingClientRect().width;
      let sl = this.rangeToSlice([-1, 1], s => m[0] + d * s);
      let ind = cs.map(c => (
        sl(this.baseline.fn(c.l))
          .map(p => Math.hypot(this.xScale(p[0]) - m[0], this.yScale(p[1] + phoneOffset(c.p)) - m[1]))
          .reduce((a, b) => Math.min(a, b), d)
        )
      ).reduce((a, b, i) => b < a[1] ? [i, b] : a, [-1, d])[0];

      this.pathHL(ind === -1 ? false : cs[ind], m, imm);
    }
  }

  stopInspect() {
    this.graph.selectAll(".inspector").remove();
  }

  addEventListeners() {
    this.graph
      .append("rect")
      .attr("x", PADDING.left)
      .attr("y", PADDING.top)
      .attr("width", INNER_WIDTH)
      .attr("height", INNER_HEIGHT)
      .attr("opacity", 0)
      .on("mousemove", this.handleMouseMove)
      .on("mouseout", () => this.interactInspect ? this.stopInspect() : this.pathHL(false))
      .on("click", () => this.handleMouseMove(true));
  }

  updatePaths(trigger) {
    this.clearLabels();
    
    let c = d3.merge(activePhones.map(p => p.activeCurves));
    let p = this.gpath.selectAll("path").data(c, d => d.id);
    let t = p
      .join("path")
      .attr("opacity", c => c.p.hide ? 0 : null)
      .classed("sample", c => c.p.samp)
      .attr("stroke", (c) => this.getTextColor(c.p, c.o))
      .call(this.redrawLine.bind(this))
      .filter(c => c.p.isTarget)
      .attr("class", "target");

    if (this.config.targetDashed) t.style("stroke-dasharray", "6, 3");
    if (this.config.targetColor) t.attr("stroke", this.config.targetColor);
    if (this.config.shareUrl && !trigger) {
      // addPhonesToUrl(this.config, targetWindow, activePhones); // TODO: move outside
    }
    if (this.config.stickyLabels) this.drawLabels();
  }

  updateYCenter() {
    let c = this.yCenter;
    
    this.yCenter = this.baseline.p ? 0 : this.config.normalizationIndex ? 60 : this.config.normalizationDb;
    this.yScale.domain(this.yScale.domain().map(d => d + (this.yCenter - c)));
    this.yAxisObj.call(this.fmtY.bind(this));
  }

  highlight(p, h) {
    this.gpath.selectAll("path").filter(c => c.p === p).classed("highlight", h);
  }
  
  setBaseline(b, no_transition) {
    this.baseline = b;
    this.updateYCenter();
    
    if (no_transition) return;
    
    this.clearLabels();

    this.gpath
      .selectAll("path")
      .transition().duration(500).ease(d3.easeQuad)
      .attr("d", this.drawLine);
    
    // TODO: move table outside
    this.table
      .selectAll("tr")
      .select(".button")
      .classed("selected", p => p === b.p);

    // Analytics event
    // if (analyticsEnabled && b.p) { pushPhoneTag("baseline_set", b.p); }
  }


  // TODO: move to hooks
  // doc.select("#inspector").on("click", function () {
  //   clearLabels();
  //   stopInspect();
  //   d3.select(this).classed("selected", this.interactInspect = !this.interactInspect);
  // });

  // doc.select("#expandTools").on("click", function () {
  //   let t = doc.select(".tools"), cl = "collapseTools", v = !t.classed(cl);
  //   [t, doc.select(".targets")].forEach(s => s.classed(cl, v));
  // });

  // d3.selectAll(".helptip").on("click", function () {
  //   let e = d3.select(this);
  //   e.classed("active", !e.classed("active"));
  // });
}

export default GraphBox;
