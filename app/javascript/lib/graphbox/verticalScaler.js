import * as d3 from "d3";

const getPathPart = (l, s) => {
  let v = l[0].toLowerCase() === "v" ? 1 : 0;

  for (let i = 2 - v; i < l.length; i += 2) {
    l[i] *= s;
  }

  return l[0] + l.slice(1).join(" ");
};

const scalePathData = (s, height) => {
  return [
    ["M", 9.9, -1],
    ["V", height],
    ["h", -1],
    ["l", -1, -1.5],
    ["l", -2.1, 2],
    ["h", -5.6],
    ["v", -1.5],
    ["q", 7, 2, 8, -7],
    ["V", 29],
    ["c", 1, -16, -10, -15, -10, -14],
    ["V", -1],
  ].map((l) => getPathPart(l, s)).join("");
}

class VerticalScaler {
  constructor(props) {
    this.h = props.h;
    this.min = props.min;
    this.max = props.max;
    this.y = props.y;
    this.H = props.H;
    this.left = props.left;
    this.graph = props.graph;
    this.onChange = props.onChange;
    
    this.outerBox = this.graph.append("g").attr("class", "dBScaler");
    this.innerBox = this.outerBox.append("g").attr("transform", this.translate);
    this.scale = this.innerBox.append("g").attr("transform", "scale(1,1)");

    this.buildScalePaths();
    this.buildDraggableLines();
    this.buildDraggableBox();
    this.buildScalingEdges();
  }

  get translate() {
    return `translate(${this.left - 9}, ${this.y})`;
  }

  addDrag(onDrag) {
    return d3
      .drag()
      .on("drag", function () { onDrag(d3.select(this)) })
      .on("start", () => { this.outerBox.classed("active", true); })
      .on("end", () => { this.outerBox.classed("active", false); });
  }

  buildScalePaths() {
    this.scale
      .selectAll()
      .data([-1, 1])
      .join("path")
      .attr("stroke", "none")
      .attr("d", (s) => scalePathData(s, this.H));
  }

  buildDraggableLines() {
    this.scale
      .selectAll()
      .data([10, 7, 13])
      .join("rect")
      .attr("x", (d, i) => i * 2.8)
      .attr("y", (d) => -d)
      .attr("width", 0.8)
      .attr("height", (d) => 2 * d)
      .attr("fill", "#bbb");
  }

  buildDraggableBox() {
    this.draggable = this.outerBox
      .append("rect")
      .attr("x", this.left - 11)
      .attr("y", this.y - this.h)
      .attr("width", 12)
      .attr("height", 2 * this.h)
      .attr("opacity", 0)
      .call(this.addDrag(this.handleDrag));
  }

  buildScalingEdges() {
    this.circ = this.innerBox
      .selectAll()
      .data([-1, 1])
      .join("circle")
      .attr("cx", 5)
      .attr("cy", (s) => this.H * s)
      .attr("r", 7)
      .attr("opacity", 0)
      .call(this.addDrag(this.handleScale));
  }

  // TODO: check if we can split creating element and adding drag 
  handleDrag(draggableBox) {
    this.y = d3.event.y;
    this.y = Math.min(this.y, this.max - this.h * (this.H / 15));
    this.y = Math.max(this.y, this.min + this.h * (this.H / 15));

    draggableBox.attr("y", this.y - this.h);

    this.innerBox.attr("transform", this.translate);
    this.onChange(this);
  }

  handleScale() {
    const h1 = Math.max(30, Math.abs(d3.event.y));
    const h2 = Math.min(this.max - this.y, this.y - this.min);
    const h = Math.min(h1, h2);
    const sc = h / this.H;

    this.h = 15 * sc;
    this.circ.attr("cy", (s) => h * s);
    this.scale.attr("transform", `scale(1, ${sc})`);
    this.draggable.attr("y", this.y - this.h).attr("height", 2 * this.h);
    this.onChange(this);
  }
}

export default VerticalScaler;
