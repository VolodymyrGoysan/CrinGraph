let pad = { l:15, r:15, t:10, b:36 };
let W0 = 800, W = W0 - pad.l - pad.r,
    H0 = 360, H = H0 - pad.t - pad.b;

let gr = d3.select("#fr-graph"),
    defs = gr.append("defs");


gr.append("rect").attrs({x:0, y:pad.t-8, width:W0, height:H0-22, rx:4,
                         fill:"white"});
watermark(gr);


// Scales
let x = d3.scaleLog()
    .domain([20,20000])
    .range([pad.l,pad.l+W]);

let yD = [29.5,85], // Decibels
    yR = [pad.t+H,pad.t+10];
let y = d3.scaleLinear().domain(yD).range(yR);


// y axis
defs.append("filter").attr("id","blur").attr("filterUnits","userSpaceOnUse")
    .attrs({x:-W-4,y:-2,width:W+8,height:4})
    .append("feGaussianBlur").attr("in","SourceGraphic")
    .attr("stdDeviation", 0.8);
let yAxis = d3.axisLeft(y).tickSize(W).tickSizeOuter(0).tickPadding(1);
function fmtY(ya) {
    let d = y.domain(),
        r = d[1] - d[0],
        t = r<40 ? 1 : 5,
        y0= Math.ceil (d[0]/t),
        y1= Math.floor(d[1]/t),
        isMinor = t===5 ? (()=>false) : ((_,i)=>(y0+i)%5!==0);
    yAxis.tickValues(d3.range(y1-y0+1).map(i=>t*(y0+i)))(ya);
    ya.select(".domain").remove();
    ya.selectAll(".tick line")
      .attr("stroke-linecap", "round")
      .attrs((_,i) => {
          let m = isMinor(_,i);
          return {
              filter: m ? null : "url(#blur)",
              "stroke-width": m ? 0.2*(1-r/45) : 0.15*(1+45/r)
          };
      });
    ya.selectAll(".tick text")
      .attr("text-anchor","start")
      .attr("x",-W+3)
      .attr("dy",-2)
      .filter(isMinor).attr("display","none");
}
let yAxisObj = gr.append("g")
    .attr("transform", "translate("+(pad.l+W)+",0)")
    .call(fmtY);
yAxisObj.insert("text")
    .attr("transform","rotate(-90)")
    .attr("fill","currentColor")
    .attr("text-anchor","end")
    .attr("y",-W-2).attr("x",-pad.t)
    .text("dB");


// x axis
let xvals = [2,3,4,5,6,8,10,15];
let xAxis = d3.axisBottom(x)
    .tickSize(H+3).tickSizeOuter(0)
    .tickValues([].concat.apply([],[1,2,3].map(e=>xvals.map(m=>m*Math.pow(10,e)))).concat([20000]))
    .tickFormat(f => f>=1000 ? (f/1000)+"k" : f);

let tickPattern = [3,0,0,1,0,0,2,0],
    getTickType = i => i===0 || i===3*8 ? 4 : tickPattern[i%8],
    tickThickness = [2,4,4,9,15].map(t=>t/10);

function fmtX(xa) {
    xAxis(xa);
    (xa.selection ? xa.selection() : xa).select(".domain").remove();
    xa.selectAll(".tick line")
      .attr("stroke", "#333")
      .attr("stroke-width", (_,i) => tickThickness[getTickType(i)]);
    xa.selectAll(".tick text").filter((_,i) => tickPattern[i%8] === 0)
      .attr("font-size","86%")
      .attr("font-weight","lighter");
    xa.select(".tick:last-of-type text")
      .attr("dx",-5)
      .text("20kHz");
    xa.select(".tick:first-of-type text")
      .attr("dx",4)
      .text("20Hz");
}
defs.append("clipPath").attr("id","x-clip")
    .append("rect").attrs({x:0, y:0, width:W0, height:H0});
let xAxisObj = gr.append("g")
    .attr("clip-path", "url(#x-clip)")
    .attr("transform", "translate(0,"+pad.t+")")
    .call(fmtX);


// Plot line
defs.selectAll().data([0,1]).join("linearGradient")
    .attrs({x1:0,y1:0, x2:1,y2:0})
    .attr("id", i=>"grad"+i)
    .selectAll().data(i=>[i,1-i]).join("stop")
    .attr("offset",(_,i)=>i)
    .attr("stop-color",j=>["black","white"][j]);
let fW = 7,  // Fade width
    fWm= 30; // Width at an interior edge
let fade = defs.append("mask")
    .attr("id", "graphFade")
    .attr("maskUnits", "userSpaceOnUse")
    .append("g").attr("transform", "translate("+pad.l+","+pad.t+")");
fade.append("rect").attrs({ x:0, y:0, width:W, height:H, fill:"white" });
let fadeEdge = fade.selectAll().data([0,1]).join("rect")
    .attrs(i=>({ x:i?W-fW:0, width:fW, y:0,height:H, fill:"url(#grad"+i+")" }));
let line = d3.line()
    .x(d=>x(d[0]))
    .y(d=>y(d[1]))
    .curve(d3.curveNatural);


// Range buttons
let selectedRange = 3; // Full range
let ranges = [[20,400],[100,4000],[1000,20000], [20,20000]],
    edgeWs = [[fW,fWm],[fWm,fWm],[fWm,fW],[fW,fW]];
let rangeSel = d3.select(".zoom").selectAll("button");
rangeSel.on("click", function (_,i) {
    let r = selectedRange,
        s = selectedRange = r===i ? 3 : i;
    rangeSel.classed("selected", (_,j)=>j===s);
    x.domain(ranges[s]);
    // More time to go between bass and treble
    let dur = Math.min(r,s)===0 && Math.max(r,s)===2 ? 1100 : 700;
    clearLabels();
    gpath.selectAll("path").transition().duration(dur).attr("d", drawLine);
    let e = edgeWs[s];
    fadeEdge.transition().duration(dur).attrs(i=>({x:i?W-e[i]:0, width:e[i]}));
    xAxisObj.transition().duration(dur).call(fmtX);
});


// y-axis scaler
let dB = {
    y: y(60),
    h: 15,
    H: y(60)-y(70),
    min: pad.t,
    max: pad.t+H,
    tr: _ => "translate("+(pad.l-9)+","+dB.y+")"
};
dB.all = gr.append("g").attr("class","dBScaler"),
dB.trans = dB.all.append("g").attr("transform", dB.tr()),
dB.scale = dB.trans.append("g").attr("transform", "scale(1,1)");
dB.scale.selectAll().data([-1,1])
    .join("path").attr("stroke","none")
    .attr("d", function (s) {
        function getPathPart(l) {
            let v=l[0].toLowerCase()==="v";
            for (let i=2-v; i<l.length; i+=2)
                l[i] *= s;
            return l[0]+l.slice(1).join(" ");
        }
        return [ ["M", 9.9,-1   ],
                 ["V",      dB.H],
                 ["h",-1        ],
                 ["l",-1  ,-1.5 ],
                 ["l",-2.1, 2   ],
                 ["h",-5.6      ],
                 ["v",     -1.5 ],
                 ["q",7,2,8,-7  ],
                 ["V",     29   ],
                 ["c",1,-16,-10,-15,-10,-14],
                 ["V",     -1   ] ].map(getPathPart).join("");
    });
dB.scale.selectAll().data([10,7,13])
    .join("rect").attrs((d,i)=>({x:i*2.8,y:-d,width:0.8,height:2*d,fill:"#bbb"}));
function getDrag(fn) {
    return d3.drag()
        .on("drag",fn)
        .on("start",function(){dB.all.classed("active",true );})
        .on("end"  ,function(){dB.all.classed("active",false);});
}
dB.mid = dB.all.append("rect")
    .attrs({x:(pad.l-11),y:dB.y-dB.h,width:12,height:2*dB.h,opacity:0})
    .call(getDrag(function () {
        dB.y = d3.event.y;
        dB.y = Math.min(dB.y, dB.max-dB.h*(dB.H/15));
        dB.y = Math.max(dB.y, dB.min+dB.h*(dB.H/15));
        d3.select(this).attr("y",dB.y-dB.h);
        dB.trans.attr("transform", dB.tr());
        dB.updatey();
    }));
dB.circ = dB.trans.selectAll().data([-1,1]).join("circle")
    .attrs({cx:5,cy:s=>dB.H*s,r:7,opacity:0})
    .call(getDrag(function () {
        let h  = Math.max(30, Math.abs(d3.event.y));
        h = Math.min(h, Math.min(dB.max-dB.y, dB.y-dB.min));
        let sc = h/dB.H;
        dB.circ.attr("cy",s=>h*s);
        dB.scale.attr("transform", "scale(1,"+sc+")");
        dB.h = 15*sc;
        dB.mid.attrs({y:dB.y-dB.h,height:2*dB.h});
        dB.updatey();
    }));
let yCenter = 60;
dB.updatey = function (dom) {
    let d = l => l[1]-l[0];
    y.domain(yR.map(y=>yCenter+(y-dB.y)*(15/dB.h)*d(yD)/d(yR)));
    yAxisObj.call(fmtY);
    let getTr = o => o ? "translate(0,"+(y(o)-y(0))+")" : null;
    clearLabels();
    gpath.selectAll("path").call(redrawLine);
}


// Label drawing and screenshot
let labelButton = d3.select("#label"),
    labelsShown = false;
function setLabelButton(l) {
    labelButton.classed("selected", labelsShown = l);
}
function clearLabels() {
    gr.selectAll(".tooltip").remove();
    setLabelButton(false);
}

function drawLabels() {
    let curves = d3.merge(
        activePhones.filter(p=>!p.hide).map(p=>p.activeCurves)
    );
    if (!curves.length) return;

    let bcurves = curves.slice(),
        bp = baseline.p;
    if (bp && bp.hide) {
        bcurves.push({ id:"Baseline: "+bp.dispBrand+" "+bp.dispName, p:bp, o:0 });
    }

    gr.selectAll(".tooltip").remove();
    let g = gr.selectAll(".tooltip").data(bcurves)
        .join("g").attr("class","tooltip").attr("opacity", 0);
    let t = g.append("text")
        .attrs({x:0, y:0, fill:c=>getTooltipColor(c)})
        .text(c=>c.id);
    g.datum(function(){return this.getBBox();});
    g.select("text").attrs(b=>({x:3-b.x, y:3-b.y}));
    g.insert("rect", "text")
        .attrs(b=>({x:2, y:2, width:b.width+2, height:b.height+2}));
    let boxes = g.data(),
        w = boxes.map(b=>b.width +6),
        h = boxes.map(b=>b.height+6);

    let v = curves.map(c => {
        let o=getOffset(c.p);
        return baseline.fn(c.l).map(d=>d[1]+o);
    });
    let tr;

    if (curves.length === 1) {
        let x0 = 50, y0 = 10,
            sl = range_to_slice([0,w[0]], o=>x0+o),
            e = d3.extent(sl(v[0]).map(y));
        if (y0+h[0] >= e[0]) { y0 = Math.max(y0, e[1]); }
        tr = [[x0,y0]];
    } else {
        let n = v.length;
        let invd = (sc,d) => sc.invert(d)-sc.invert(0),
            xr = x.range(),
            yd = y.domain(),
            wind = w => Math.ceil((w/(xr[1]-xr[0]))*f_values.length),
            mw = wind(d3.min(w));
        let winReduce = (l,w,d0,fn) => {
            l = l.slice();
            for (let d=d0; d<w; ) {
                let diff = Math.min(2*d,w) - d;
                for (let i=0; i<l.length-diff; i++) {
                    l[i] = fn(l[i], l[i+diff]);
                }
                d += diff;
            }
            l.length -= w-d0;
            return l;
        }
        let getRanges = [Math.min, Math.max].map(f => {
            let t = v.map(c => winReduce(c, mw, 1, f));
            return w => t.map(c => winReduce(c, w, mw, f));
        });
        let top = 0; // Use top left if we can't find a spot
        tr = v.map((e,j) => {
            let we = wind(w[j]),
                he = -invd(y,h[j]),
                range = d3.transpose(getRanges.map(r => r(we))),
                ds;
            ds = range[j].map(function (r,ri) {
                let le = r.length,
                    s = [[-he,0],[0,he]][ri].map(o=>r.map(d=>d+o)),
                    d = r.map(_=>1e10);
                for (let k=0; k<n; k++) if (k!==j) {
                    let t = range[k];
                    for (let i=0; i<le; i++) {
                        d[i] = Math.min(d[i], Math.max(s[0][i]-t[1][i],
                                                       t[0][i]-s[1][i]));
                    }
                }
                return d;
            });
            let sep = 0, pos = null;
            ds.forEach(function (drow,k) {
                for (let ii=0; ii<drow.length; ) {
                    let i=ii, d=drow[i],
                        rjk=range[j][k], m=rjk[i];
                    while (ii++, ii<drow.length && rjk[ii]===m) {
                        let di = drow[ii];
                        if (di<d && di<1) break;
                        d = Math.max(d,drow[ii]);
                    }
                    let clip = x => x/Math.sqrt(1+x*x);
                    d += clip((ii-i)/3);
                    i = Math.floor((i+ii)/2);
                    let dl = drow.length,
                        r = i/dl;
                    d *= Math.sqrt((0.8+r)*Math.sqrt(1-r));
                    d *= clip(0.2+Math.max(0,(i>=15?drow[i-15]:0)+(i<dl-15?drow[i+15]:0)));
                    if (d>sep) {
                        let dy = range[j][k][i]+(k?he:0),
                            yd = y.domain();
                        if (yd[0]+he<=dy && dy<=yd[1]) { sep=d; pos=[i,dy]; }
                    }
                }
            });
            return pos ? [x(f_values[pos[0]]), y(pos[1])]
                       : [60, 20+30*top++];
        });
    }
    for (let j=curves.length; j<bcurves.length; j++) {
        tr.push([pad.l+(W-w[j])/2, pad.t+H-h[j]+2]);
    }
    g.attr("transform",(_,i)=>"translate("+tr[i].join(",")+")");
    g.attr("opacity",null);
    setLabelButton(true);
}

labelButton.on("click", () => (labelsShown?clearLabels:drawLabels)());

d3.select("#download").on("click", function () {
    let showControls = s => dB.all.attr("visibility",s?null:"hidden");
    gpath.selectAll("path").classed("highlight",false);
    drawLabels();
    showControls(false);
    saveSvgAsPng(gr.node(), "graph.png", {backgroundColor:"white", scale:3})
        .then(()=>showControls(true));
});


// Graph smoothing
let pair = (arr,fn) => arr.slice(1).map((v,i)=>fn(v,arr[i]));

function smooth_prep(h, d) {
    let rh = h.map(d=>1/d),
        G = [ rh.slice(0,rh.length-1),
              pair(rh, (a,b)=>-(a+b)),
              rh.slice(1) ],
        dv = d3.range(rh.length+1).map(i=>d(i)),
        dG = G.map((r,j) => r.map((e,i) => e*dv[i+j])),
        d2 = dv.map(e=>e*e),
        h6 = h.map(d=>d/6),
        M = [ pair(h6, (a,b)=>2*(a+b)),
              h6.slice(1,h6.length-1),
              h6.slice(3).map(_=>0) ];
    dG.forEach((_,k) =>
        dG.slice(k).forEach((g,i) =>
            dG[i].slice(k).forEach((a,j) => M[k][j] += a*g[j])
        )
    );

    // Diagonal LDL decomposition of M
    let md = [M[0][0]],
        ml = M.slice(1).map(m=>[m[0]/md]);
    d3.range(1,M[0].length).forEach(j => {
        let n = ml.length,
            p = md.slice(-n).reverse().map((d,i)=>d*ml[i][j-1-i]),
            a = M.map((m,k) => m[j] - d3.sum(p.slice(0,n-k),
                      (a,i) => a*ml[k+i][j-1-i]));
        md.push(a[0]);
        ml.forEach((l,j)=>l.push(a[j+1]/a[0]));
    });

    return { G:G, md:md, ml:ml, d2:d2 };
}

function smooth_eval(p, y) {
    let Gy = p.G[0].map(_=>0),
        n = Gy.length;
    p.G.forEach((r,j) => r.forEach((e,i) => Gy[i] += e*y[i+j]));
    // Forward substitution and multiply by p.md
    for (let i=0; i<n; i++) {
        let yi = Gy[i];
        p.ml.forEach((m,k) => { let j=i+k+1; if (j<n) Gy[j] -= m[i]*yi; });
        Gy[i] /= p.md[i];
    }
    // Back substitution
    for (let i=n; i--; ) {
        let yi = Gy[i];
        p.ml.forEach((m,k) => { let j=i-k-1; if (j>=0) Gy[j] -= m[j]*yi; });
    }
    let u = y.slice();
    p.G.forEach((r,j) => r.forEach((e,i) => u[i+j] -= e*p.d2[i+j]*Gy[i]));
    return u;
}

let smooth_level = 5,
    smooth_param = undefined;
function smooth(y) {
    if (smooth_param === 0) { return y; }
    if (!smooth_param) {
        let x = f_values.map(f=>Math.log(f)),
            h = pair(x, (a,b)=>a-b),
            d = i => smooth_level*0.01*Math.pow(1/80,Math.pow(i/x.length,2));
        smooth_param = smooth_prep(h, d);
    }
    return smooth_eval(smooth_param, y);
}

function smoothPhone(p) {
    if (p.smooth !== smooth_level) {
        p.channels = p.rawChannels.map(
            c=>c?smooth(c.map(d=>d[1])).map((d,i)=>[c[i][0],d]):c
        );
        p.smooth = smooth_level;
        setCurves(p, p.avg);
    }
}

d3.select("#smooth-level").on("change input", function () {
    if (!this.checkValidity()) return;
    smooth_level = +this.value;
    smooth_param = undefined;
    line.curve(smooth_level ? d3.curveNatural : d3.curveCardinal.tension(0.5));
    activePhones.forEach(smoothPhone);
    updatePaths();
});


// Normalization with target loudness
const iso223_params = { // :2003
    f  : [   20,    25, 31.5,    40,    50,    63,    80,   100,   125,  160,   200,   250,   315,   400,   500,   630,   800, 1000,  1250,  1600,  2000,  2500,  3150,  4000,  5000,  6300,  8000, 10000, 12500],
    a_f: [0.532, 0.506, 0.48, 0.455, 0.432, 0.409, 0.387, 0.367, 0.349, 0.33, 0.315, 0.301, 0.288, 0.276, 0.267, 0.259, 0.253, 0.25, 0.246, 0.244, 0.243, 0.243, 0.243, 0.242, 0.242, 0.245, 0.254, 0.271, 0.301],
    L_U: [-31.6, -27.2,  -23, -19.1, -15.9,   -13, -10.3,  -8.1,  -6.2, -4.5,  -3.1,    -2,  -1.1,  -0.4,     0,   0.3,   0.5,    0,  -2.7,  -4.1,    -1,   1.7,   2.5,   1.2,  -2.1,  -7.1, -11.2, -10.7,  -3.1],
    T_f: [ 78.5,  68.7, 59.5,  51.1,    44,  37.5,  31.5,  26.5,  22.1, 17.9,  14.4,  11.4,   8.6,   6.2,   4.4,     3,   2.2,  2.4,   3.5,   1.7,  -1.3,  -4.2,    -6,  -5.4,  -1.5,     6,  12.6,  13.9,  12.3]
};
const free_field = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.0725,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.0896,0,0,0,0,0,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.0967,0,0,0,0,0,0,0,0.0886,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.0656,0,0,0,0,0,0.024,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.045,0,0,0,0,0,0,0.029,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1524,0.2,0.2,0.2386,0.3395,0.4,0.437,0.5,0.5287,0.6225,0.7,0.7063,0.7962,0.8,0.8941,0.9,0.9863,1,1.0729,1.1,1.1544,1.2,1.2504,1.3,1.3,1.3,1.3,1.3163,1.4,1.4,1.4,1.4,1.4017,1.4846,1.5,1.5,1.5748,1.6,1.6,1.653,1.7,1.7,1.7487,1.8,1.8341,1.9,1.9,1.9229,2,2,2,2.1,2.1,2.1897,2.2,2.2,2.2674,2.3,2.3,2.3567,2.4,2.4,2.4446,2.5,2.5262,2.6,2.6234,2.7149,2.8,2.8038,2.9011,2.9969,3.0913,3.1845,3.2762,3.3757,3.4649,3.5617,3.657,3.751,3.8,3.8432,3.9332,4,4,4,4.0121,4.1,4.1,4.1,4.0079,4,4,4,4,3.9334,3.9,3.9,3.9,3.8541,3.8,3.8,3.768,3.7,3.6761,3.6,3.6,3.5927,3.5,3.5,3.5,3.5,3.5,3.5761,3.6,3.6,3.6604,3.7,3.7514,3.8,3.8,3.8349,3.9,3.9218,4.0199,4.1123,4.2076,4.3016,4.3985,4.6816,5.0515,5.4222,5.8036,6.1097,6.4656,6.8461,7.3316,7.9083,8.4305,8.9369,9.5105,10.0759,10.6024,11.0027,11.4847,12.0482,12.5152,12.8994,13.2776,13.7381,14.1303,14.5168,14.8858,15.273,15.6547,15.9731,16.2596,16.542,16.7857,17.0111,17.2325,17.3532,17.522,17.6,17.6,17.6,17.6,17.5044,17.41,17.3145,17.2205,17.1255,17.0318,16.9373,16.784,16.6459,16.4536,16.2578,16.1234,15.967,15.8736,15.7552,15.566,15.3879,15.2881,15.0958,14.9064,14.8099,14.6287,14.5201,14.3477,14.2307,14.0709,13.9399,13.7916,13.6514,13.5552,13.4604,13.367,13.2718,13.1766,13.0812,12.9743,12.7916,12.6975,12.602,12.5078,12.3247,12.0547,11.7686,11.4154,11.1009,10.9385,10.7344,10.3998,10.0163,9.6382,9.2957,8.9799,8.6248,8.3404,8.0424,7.674,7.3851,7.0061,6.5307,6.1484,5.7696,5.4662,5.1084,4.7302,4.3498,3.971,3.6455,3.4075,3.1343,2.7917,2.5376,2.3484,2.1585,1.9849,1.9107,2,2,2,2.0894,2.1844,2.2787,2.374,2.6057,2.8265,3.0161,3.2057,3.3954,3.5851,3.8122,4.0967,4.354,4.5651,4.8509,5.1459,5.5259,5.9041,6.1881,6.5643,6.8561,7.1418,7.4251,7.7093,8.0593,8.3192,8.4541,8.5493,8.6437,8.7,8.7336,8.8,8.8,8.8,8.8,8.7926,8.7,8.7,8.6079,8.5133,8.5,8.4237,8.1863,7.968,7.7786,7.4219,6.948,6.4299,5.8212,5.1563,4.4634,3.7042,2.8897,1.9005,1.2368,0.5651,-0.2856,-0.8593,-2.9].map(v=>v-7);

let norm_par = []; // Interpolated values for find_offset
function init_normalize() {
    norm_par = [];
    const p = iso223_params;
    let i = 0;
    f_values.forEach(function (f) {
        if (f >= p.f[i]) { i++; }
        let i0 = Math.max(0,i-1),
            i1 = Math.min(i,p.f.length-1),
            g;
        if (i0===i1) {
            g = n => p[n][i0];
        } else {
            let ll= [p.f[i0],p.f[i1],f].map(x=>Math.log(x)),
                l = (ll[2]-ll[0])/(ll[1]-ll[0]);
            g = n => { let v=p[n]; return v[i0]+l*(v[i1]-v[i0]); };
        }
        let a = g("a_f"),
            m = a * (Math.log10(4)-10 + g("L_U")/10),
            k = (0.005076/Math.pow(10,m)) - Math.pow(10, a*g("T_f")/10),
            c = Math.pow(10, 9.4 + 4*m) / f_values.length;
        norm_par.push({a:a, k:k, c:c});
    });
}

// Find the appropriate offset (in dB) for fr so that the total loudness
// is equal to target (in phon)
function find_offset(fr, target) {
    if (!norm_par.length) { init_normalize(); }
    let x = 0; // Initial offset
    function getStep(o) {
        const l10 = Math.log(10)/10;
        let v=0, d=0;
        norm_par.forEach(function (p,i) {
            let a=p.a, k=p.k, c=p.c, ds,v0,v1;
            v0  = Math.exp(l10*(fr[i]+o-free_field[i]));
            ds  = l10 * v0;
            v1  = k + Math.pow(v0,a);
            ds *= a * Math.pow(v0,a-1);
            v  += c * Math.pow(v1,4);
            ds *= c * 4 * Math.pow(v1,3);
            d  += ds;
        });
        // value: Math.log(v)/l10
        // deriv: d / (l10*v)
        return (Math.log(v) - target*l10) * (v/d);
    }
    let dx;
    do {
        dx = getStep(x);
        x -= dx;
    } while (Math.abs(dx) > 0.01);
    return x;
}


// File loading and channel management
const LR = ["L","R"];
function loadFiles(p, callback) {
    let l = f => d3.text(DIR+f+".txt").catch(()=>null);
    let f = p.isTarget ? [l(p.fileName)]
          : LR.map(s => l(p.fileName+" "+s));
    Promise.all(f).then(function (frs) {
        if (!frs.some(f=>f!==null)) {
            alert("Headphone not found!");
        } else {
            callback(frs.map(f => f && tsvParse(f)));
        }
    });
}
let validChannels = p => p.channels.filter(c=>c!==null);
let has1Channel = p => p.isTarget || p.channels.some(c=>c===null);

function avgCurves(curves) {
    return curves
        .map(c=>c.map(d=>Math.pow(10,d[1]/20)))
        .reduce((as,bs) => as.map((a,i) => a+bs[i]))
        .map((x,i) => [curves[0][i][0], 20*Math.log10(x/curves.length)]);
}
function getAvg(p) {
    return p.avg          ? p.activeCurves[0].l
         : has1Channel(p) ? validChannels(p)[0]
         :                  avgCurves(p.channels);
}
function hasImbalance(p) {
    if (has1Channel(p)) return false;
    let as = p.channels[0], bs = p.channels[1];
    let s0=0, s1=0;
    return as.some((a,i) => {
        let d = a[1]-bs[i][1];
        d *= 1/(50 * Math.sqrt(1+Math.pow(a[0]/1e4,6)));
        s0 = Math.max(s0+d,0);
        s1 = Math.max(s1-d,0);
        return Math.max(s0,s1) > max_channel_imbalance;
    });
}

let activePhones = [];
let baseline0 = { p:null, l:null, fn:l=>l },
    baseline = baseline0;

let gpath = gr.insert("g",".dBScaler")
    .attr("fill","none")
    .attr("stroke-width",2.3)
    .attr("mask","url(#graphFade)");
function hl(p, h) {
    gpath.selectAll("path").filter(c=>c.p===p).classed("highlight",h);
}
let table = d3.select(".curves");

let ld_p1 = 1.1673039782614187;
function getCurveColor(id, o) {
    let p1 = ld_p1,
        p2 = p1*p1,
        p3 = p2*p1;
    let t = o/32;
    let i=id/p3+0.76, j=id/p2+0.79, k=id/p1+0.32;
    if (id < 0) { return d3.hcl(360*(1-(-i)%1),5,66); } // Target
    let th = 2*Math.PI*i;
    i += Math.cos(th-0.3)/24 + Math.cos(6*th)/32;
    let s = Math.sin(2*Math.PI*i);
    return d3.hcl(360*((i + t/p2)%1),
                  88+30*(j%1 + 1.3*s - t/p3),
                  36+22*(k%1 + 1.1*s + 6*t*(1-s)));
}
let getColor_AC = c => getCurveColor(c.p.id, c.o);
let getColor_ph = (p,i) => getCurveColor(p.id, p.activeCurves[i].o);
function getDivColor(id, active) {
    let c = getCurveColor(id,0);
    c.l = 100-(80-Math.min(c.l,60))/(active?1.5:3);
    c.c = (c.c-20)/(active?3:4);
    return c;
}
function color_curveToText(c) {
    c.l = c.l/5 + 10;
    c.c /= 3;
    return c;
}
let getTooltipColor = curve => color_curveToText(getColor_AC(curve));
let getTextColor = p => color_curveToText(getCurveColor(p.id,0));

let cantCompare;
if (typeof max_compare !== "undefined") {
    const currency = [
        ["$", "#348542"],
        ["¥", "#d11111"],
        ["€", "#2961d4"],
        ["฿", "#dcaf1d"]
    ];
    let currencyCounter = -1,
        lastMessage = null,
        messageWeight = 0;
    if (typeof disallow_target === "undefined") { disallow_target=false; }
    cantCompare = function(m, target, noMessage) {
        if (m<max_compare && !(target&&disallow_target)) { return false; }
        if (noMessage) { return true; }
        let div = d3.select("body").append("div");
        let c = currency[currencyCounter++ % currency.length];
        let lm = lastMessage;
        lastMessage = Date.now();
        messageWeight *= Math.pow(2, (lm?lm-lastMessage:0)/3e4); // 30-second half-life
        messageWeight++;
        if (!currencyCounter || messageWeight>=2) {
            messageWeight /= 2;
            let button = div.attr("class","cashMessage")
                .html(premium_html)
                .append("button").text("Fine")
                .on("mousedown", ()=>messageWeight=0);
            button.node().focus();
            let back = d3.select("body").append("div")
                .attr("class","fadeAll");
            [button,back].forEach(e =>
                e.on("click", ()=>[div,back].forEach(e=>e.remove()))
            );
        } else {
            div.attr("class","cash")
                .style("color",c[1]).text(c[0])
                .transition().duration(120).remove();
        }
        return true;
    }
} else {
    cantCompare = function(m) { return false; }
}

let phoneNumber = 0; // I'm so sorry it just happened
// Find a phone id which doesn't have a color conflict with pins
let nextPN = 0; // Cached value; invalidated when pinned headphones change
function nextPhoneNumber() {
    if (nextPN === null) {
        nextPN = phoneNumber;
        let pin = activePhones.filter(p => p.pin).map(p=>p.id);
        if (pin.length) {
            let p3 = ld_p1*ld_p1*ld_p1,
                l = a => b => Math.abs(((a-b)/p3 + 0.5) % 1 - 0.5),
                d = id => d3.min(pin, l(id));
            for (let i=nextPN, max=d(i); max<0.12 && ++i<phoneNumber+3; ) {
                let m = d(i);
                if (m > max) { max=m; nextPN=i; }
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

function setPhoneTr(phtr) {
    phtr.each(function (p) {
        p.highlight = p.active;
        let o = p.objs; if (!o) return;
        p.objs = o = o.filter(q=>q.active);
        if (o.length === 0) {
            delete p.objs;
        } else if (!p.active) {
            p.id = o[0].id;
            p.highlight = true;
        }
    });
    phtr.style("background",p=>p.isTarget&&!p.active?null:getDivColor(p.id,p.highlight))
        .style("border-color",p=>p.highlight?getDivColor(p.id,1):null);
    phtr.filter(p=>!p.isTarget)
        .selectAll(".remove").data(p=>p.highlight?[p]:[])
        .join("span").attr("class","remove").text("⊗")
        .on("click", p => { d3.event.stopPropagation(); removeCopies(p); });
}

let channelbox_x = c => c?-86:-36,
    channelbox_tr = c => "translate("+channelbox_x(c)+",0)";
function setCurves(p, avg, lr) {
    let dx = +avg - +p.avg;
    p.avg = avg;
    if (!p.isTarget) {
        let id = n => p.dispBrand + " " + p.dispName + " ("+n+")";
        p.activeCurves = avg && !has1Channel(p)
            ? [{id:id("AVG"), l:avgCurves(p.channels), p:p, o:0}]
            : p.channels.map((l,i) => ({id:id(LR[i]), l:l, p:p, o:-1+2*i}))
                        .filter(c => c.l);
    } else {
        p.activeCurves = [{id:p.fullName, l:p.channels[0], p:p, o:0}];
    }
    let y = 0;
    let k = d3.selectAll(".keyLine").filter(q=>q===p);
    let ksb = k.select(".keySelBoth").attr("display","none");
    if (lr!==undefined) {
        p.activeCurves = [p.activeCurves[lr]];
        y = [-1,1][lr];
        ksb.attr("display",null).attr("y", [0,-12][lr]);
    }
    k.select(".keyMask")
        .transition().duration(400)
        .attr("x", channelbox_x(avg))
        .attrTween("y", function () {
            let y0 = +this.getAttribute("y"),
                y1 = 12*(-1+y);
            if (!dx) { return d3.interpolateNumber(y0,y1); }
            let ym = y0 + (y1-y0)*(3-2*dx)/6;
            y0-=ym; y1-=ym;
            return t => { t-=1/2; return ym+(t<0?y0:y1)*Math.pow(2,20*(Math.abs(t)-1/2)); };
        });
    k.select(".keySel").attr("transform", channelbox_tr(avg));
}

let drawLine = d => line(baseline.fn(d.l));
function redrawLine(p) {
    let getTr = o => o ? "translate(0,"+(y(o)-y(0))+")" : null;
    p.attr("transform", c => getTr(getOffset(c.p))).attr("d", drawLine);
}
function updateYCenter() {
    let c = yCenter;
    yCenter = baseline.p ? 0 : norm_sel ? 60 : norm_phon;
    y.domain(y.domain().map(d=>d+(yCenter-c)));
    yAxisObj.call(fmtY);
}
function setBaseline(b) {
    baseline = b;
    updateYCenter();
    clearLabels();
    gpath.selectAll("path")
        .transition().duration(500).ease(d3.easeQuad)
        .attr("d", drawLine);
    table.selectAll("tr").select(".button")
        .classed("selected", p=>p===baseline.p);
}
function getBaseline(p) {
    let b = getAvg(p).map(d => d[1]+getOffset(p));
    return { p:p, fn:l=>l.map((e,i)=>[e[0],e[1]-b[i]]) };
}

function setOffset(p, o) {
    p.offset = +o;
    if (baseline.p === p) { baseline = getBaseline(p); }
    updatePaths();
}
let getOffset = p => p.offset + p.norm;

function setHover(elt, h) {
    elt.on("mouseover", h(true)).on("mouseout", h(false));
}

function updatePaths() {
    clearLabels();
    let c = d3.merge(activePhones.map(p => p.activeCurves)),
        p = gpath.selectAll("path").data(c, d=>d.id);
    p.join("path").attr("opacity", c=>c.p.hide?0:null)
        .attr("stroke", getColor_AC).call(redrawLine);
}
let colorBar = p=>'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 8"><path d="M0 8v-8h1c0.05 1.5,-0.3 3,-0.16 5s0.1 2,0.15 3z" opacity="0.85" fill="'+getCurveColor(p.id,0)+'"/></svg>\')';
function updatePhoneTable() {
    let c = table.selectAll("tr").data(activePhones, p=>p.id);
    c.exit().remove();
    let f = c.enter().append("tr"),
        td = () => f.append("td");
    f   .call(setHover, h => p => hl(p,h))
        .style("color", p => getDivColor(p.id,true));

    td().attr("class","remove").text("⊗")
        .on("click", removePhone)
        .style("background-image",colorBar)
        .style("background-size","contain").style("background-repeat","no-repeat");
    td().html(p=>p.isTarget?"":p.dispBrand+"&nbsp;").call(addModel);
    td().append("svg").call(addKey);
    td().append("input")
        .attrs({type:"number",step:"any",value:0})
        .property("value", p=>p.offset)
        .on("change input",function(p){ setOffset(p, +this.value); });
    td().attr("class","button")
        .html("<svg viewBox='-170 -120 340 240'><use xlink:href='#baseline-icon'></use></svg>")
        .on("click", p => setBaseline(p===baseline.p ? baseline0
                                                     : getBaseline(p)));
    function toggleHide(p) {
        let h = p.hide;
        let t = table.selectAll("tr").filter(q=>q===p);
        t.select(".keyLine").on("click", h?null:toggleHide)
            .selectAll("path,.imbalance").attr("opacity", h?null:0.5);
        t.select(".hideIcon").classed("selected", !h);
        clearLabels();
        gpath.selectAll("path").filter(c=>c.p===p)
            .attr("opacity", h?null:0);
        p.hide = !h;
    }
    td().attr("class","button hideIcon")
        .html("<svg viewBox='-2.5 0 19 12'><use xlink:href='#hide-icon'></use></svg>")
        .on("click", toggleHide);
    td().attr("class","button")
        .html("<svg viewBox='-135 -100 270 200'><use xlink:href='#pin-icon'></use></svg>")
        .on("click",function(p){
            if (cantCompare(activePhones.filter(p=>p.pin).length+1)) return;
            p.pin = true; nextPN = null;
            d3.select(this)
                .text(null).classed("button",false)
                .insert("svg").attr("class","pinMark")
                .attr("viewBox","0 0 280 145")
                .insert("path").attrs({
                    fill:"none",
                    stroke:"#445",
                    "stroke-width":30,
                    "stroke-linecap":"round",
                    d:"M265 110V25q0 -10 -10 -10H105q-24 0 -48 20l-24 20q-24 20 -2 40l18 15q24 20 42 20h100"
                });
        });
}

function addKey(s) {
    s.attr("class","keyLine").attr("viewBox","-19 -12 65 24");
    let defs = s.append("defs");
    defs.append("linearGradient").attr("id", p=>"chgrad"+p.id)
        .attrs({x1:0,y1:0, x2:0,y2:1})
        .selectAll().data(p=>[0.1,0.4,0.6,0.9].map(o =>
            [o, getCurveColor(p.id, o<0.3?-1:o<0.7?0:1)]
        )).join("stop")
        .attr("offset",i=>i[0])
        .attr("stop-color",i=>i[1]);
    defs.append("linearGradient").attr("id","blgrad")
        .selectAll().data([0,0.25,0.31,0.69,0.75,1]).join("stop")
        .attr("offset",o=>o)
        .attr("stop-color",(o,i) => i==2||i==3?"white":"#333");
    let m = defs.append("mask").attr("id",p=>"chmask"+p.id);
    m.append("rect").attrs({x:-19, y:-12, width:65, height:24, fill:"#333"});
    m.append("rect").attrs({"class":"keyMask", x:p=>channelbox_x(p.avg), y:-12, width:120, height:24, fill:"url(#blgrad)"});
    let t = s.append("g");
    t.append("path")
        .attr("stroke", p => p.isTarget ? getCurveColor(p.id,0)
                                        : "url(#chgrad"+p.id+")");
    t.selectAll().data(p=>p.isTarget?[]:LR)
        .join("text")
        .attrs({x:17, y:(_,i)=>[-6,6][i], dy:"0.32em", "text-anchor":"start", "font-size":10.5})
        .text(t=>t);
    t.filter(p=>p.isTarget).append("text")
        .attrs({x:17, y:0, dy:"0.32em", "text-anchor":"start",
                "font-size":8, fill:p=>getCurveColor(p.id,0)})
        .text("Target");
    let scuh = f => function (p) {
        setCurves(p, f(p));
        updatePaths(); hl(p,true);
    }
    s.append("rect").attr("class","keySelBoth")
        .attrs({x:40+channelbox_x(0), width:40, height:12,
                opacity:0, display:"none"})
        .on("click", scuh(p=>0));
    s.append("g").attr("class","keySel")
        .attr("transform",p=>channelbox_tr(p.avg))
        .on("click", scuh(p=>!p.avg))
        .selectAll().data([0,80]).join("rect")
        .attrs({x:d=>d, y:-12, width:40, height:24, opacity:0});
    let o = s.selectAll().data(p=>[[p,0],[p,1]])
        .join("g").attr("class","keyOnly")
        .attr("transform",pi=>"translate(25,"+[-6,6][pi[1]]+")")
        .call(setHover, h => function (pi) {
            let p = pi[0], cs = p.activeCurves;
            if (!p.hide && cs.length===2) {
                d3.event.stopPropagation();
                hl(p, h ? (c=>c===cs[pi[1]]) : true);
                clearLabels();
                gpath.selectAll("path").filter(c=>c.p===p).attr("opacity",h ? (c=>c!==cs[pi[1]]?0.7:null) : null);
            }
        })
        .on("click", pi => { setCurves(pi[0], false, pi[1]); updatePaths(); });
    o.append("rect").attrs({x:0,y:-6,width:30,height:12,opacity:0});
    o.append("text").attrs({x:0, y:0, dy:"0.28em", "text-anchor":"start",
                            "font-size":7.5 })
        .text("only");
    s.append("text").attr("class","imbalance")
        .attrs({x:8,y:0,dy:"0.35em","font-size":10.5})
        .text("!");
    updateKey(s);
}

function updateKey(s) {
    let disp = fn => e => e.attr("display",p=>fn(p)?null:"none");
    s.select(".imbalance").call(disp(hasImbalance));
    s.select(".keySel").call(disp(p=>!has1Channel(p)));
    s.selectAll(".keyOnly").call(disp(pi=>!has1Channel(pi[0])));
    s.selectAll("text").data(p=>p.channels).call(disp(c=>c));
    s.select("g").attr("mask",p=>has1Channel(p)?null:"url(#chmask"+p.id+")");
    s.select("path").attr("d", p =>
        p.isTarget ? "M15 0H-17" :
        ["M15 -6H9C0 -6,0 0,-9 0H-17","M-17 0H-9C0 0,0 6,9 6H15"]
            .filter((_,i) => p.channels[i])
            .reduce((a,b) => a+b.slice(6))
    );
}

function addModel(t) {
    t.each(function (p) { if (!p.vars) { p.vars = {}; } });
    let n = t.append("div").attr("class","phonename").text(p=>p.dispName);
    t.filter(p=>p.fileNames)
        .append("svg").attr("class","variants")
        .call(function (s) {
            s.attr("viewBox","0 -2 10 11");
            s.append("path").attr("fill","currentColor")
                .attr("d","M1 2L5 6L9 2L8 1L6 3Q5 4 4 3L2 1Z");
        })
        .attr("tabindex",0) // Make focusable
        .on("focus", function (p) {
            if (p.selectInProgress) return;
            p.selectInProgress = true;
            p.vars[p.fileName] = p.rawChannels;
            d3.select(this)
                .on("mousedown", function () {
                    d3.event.preventDefault();
                    this.blur();
                })
                .select("path").attr("transform","translate(0,7)scale(1,-1)");
            let n = d3.select(this.parentElement).select(".phonename");
            n.text("");
            let q = p.copyOf || p,
                o = q.objs || [p],
                active_fns = o.map(v=>v.fileName),
                dns = q.dispNames || q.fileNames;
                vars = p.fileNames.map((f,i) => {
                    let j = active_fns.indexOf(f);
                    return j!==-1 ? o[j] :
                        {fileName:f, dispName:dns[i]};
                });
            let d = n.selectAll().data(vars).join("div")
                     .attr("class","variantName").text(v=>v.dispName),
                w = d3.max(d.nodes(), d=>d.getBoundingClientRect().width);
            d.style("width",w+"px");
            d.filter(v=>v.active)
                .style("cursor","initial")
                .style("color", getTextColor)
                .call(setHover, h => p =>
                    table.selectAll("tr").filter(q=>q===p)
                        .classed("highlight", h)
                );
            let c = n.selectAll().data(vars).join("div")
                .html("&nbsp;⇲&nbsp;").attr("class","variantPopout")
                .style("left",(w+5)+"px")
                .style("display",v=>v.active?"none":null);
            [d,c].forEach(e=>e.transition().style("top",(_,i)=>i*1.3+"em"));
            d.filter(v=>!v.active).on("mousedown", v => Object.assign(p,v));
            c.on("mousedown", function (v,i) {
                if (cantCompare(activePhones.length)) return;
                if (!q.objs) { q.objs = [q]; }
                v.active=true; v.copyOf=q;
                ["brand","dispBrand","fileNames","vars"].map(k=>v[k]=q[k]);
                q.objs.push(v);
                changeVariant(v, showPhone);
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
                .call(setHover, h=>p=>null)
                .transition().style("top",0+"em").remove()
                .end().then(()=>n.text(p=>p.dispName));
            changeVariant(p, updateVariant);
            table.selectAll("tr").classed("highlight", false); // Prevents some glitches
        });
    t.filter(p=>p.isTarget).append("span").text(" Target");
}

function updateVariant(p) {
    updateKey(table.selectAll("tr").filter(q=>q===p).select(".keyLine"));
    normalizePhone(p);
    updatePaths();
}
function changeVariant(p, update) {
    let fn = p.fileName,
        ch = p.vars[fn];
    function set(ch) {
        p.rawChannels = ch; p.smooth = undefined;
        smoothPhone(p);
        setCurves(p, p.avg);
        update(p);
    }
    if (ch) {
        set(ch);
    } else {
        loadFiles(p, set);
    }
}

let f_values; // Assumed to be the same for all headphones
let fr_to_ind = fr => d3.bisect(f_values, fr, 0, f_values.length-1);
function range_to_slice(xs, fn) {
    let r = xs.map(v => d3.bisectLeft(f_values, x.invert(fn(v))));
    return a => a.slice(Math.max(r[0],0), r[1]+1);
}
let norm_sel = 0,
    norm_fr = 1000,
    norm_phon = 60;
function normalizePhone(p) {
    if (norm_sel) { // fr
        let i = fr_to_ind(norm_fr);
        let avg = l => 20*Math.log10(d3.mean(l, d=>Math.pow(10,d/20)));
        p.norm = 60 - avg(validChannels(p).map(l=>l[i][1]));
    } else { // phon
        p.norm = find_offset(getAvg(p).map(v=>v[1]), norm_phon);
    }
}

let norms = d3.select(".normalize").selectAll("div");
norms.classed("selected",(_,i)=>i===norm_sel);
function setNorm(_, i, change) {
    if (change !== false) {
        if (!this.checkValidity()) return;
        let v = +this.value;
        if (i) { norm_fr=v; } else { norm_phon=v; }
    }
    norm_sel = i;
    norms.classed("selected",(_,i)=>i===norm_sel);
    activePhones.forEach(normalizePhone);
    if (baseline.p) { baseline = getBaseline(baseline.p); }
    updateYCenter();
    updatePaths();
}
norms.select("input")
    .on("change input",setNorm)
    .on("keypress", function(_, i) {
        if (d3.event.key==="Enter") { setNorm.bind(this)(_,i); }
    });
norms.select("span").on("click", (_,i)=>setNorm(_,i,false));

let addPhoneSet = false, // Whether add phone button was clicked
    addPhoneLock= false;
function setAddButton(a) {
    if (a && cantCompare(activePhones.length)) return false;
    if (addPhoneSet !== a) {
        addPhoneSet = a;
        d3.select(".addPhone").classed("selected", a)
            .classed("locked", addPhoneLock &= a);
    }
    return true;
}
d3.select(".addPhone").selectAll("td")
    .on("click", ()=>setAddButton(!addPhoneSet));
d3.select(".addLock").on("click", function () {
    d3.event.preventDefault();
    let on = !addPhoneLock;
    if (!setAddButton(on)) return;
    if (on) {
        d3.select(".addPhone").classed("locked", addPhoneLock=true);
    }
});

function showPhone(p, exclusive, suppressVariant) {
    if (p.isTarget && activePhones.indexOf(p)!==-1) {
        removePhone(p);
        return;
    }
    if (addPhoneSet) {
        exclusive = false;
        if (!addPhoneLock || cantCompare(activePhones.length+1,null,true)) {
            setAddButton(false);
        }
    }
    if (cantCompare(exclusive?0:activePhones.length, p.isTarget)) return;
    if (!p.rawChannels) {
        loadFiles(p, function (ch) {
            if (p.rawChannels) return;
            p.rawChannels = ch;
            if (!f_values) { f_values = ch[0].map(d=>d[0]); }
            showPhone(p, exclusive, suppressVariant);
        });
        return;
    }
    smoothPhone(p);
    if (p.id === undefined) { p.id = getPhoneNumber(); }
    normalizePhone(p); p.offset=p.offset||0;
    if (exclusive) {
        activePhones = activePhones.filter(q=>
            q.active = q.copyOf===p || q.pin || q.isTarget!==p.isTarget
        );
        if (baseline.p && !baseline.p.active) baseline = baseline0;
    }
    if (activePhones.indexOf(p)===-1 && !p.objs) {
        if (activePhones.length===1 && activePhones[0].activeCurves.length!==1) {
            setCurves(activePhones[0], true);
        }
        if (!p.isTarget) {
            activePhones.push(p);
        } else {
            activePhones.unshift(p);
        }
        p.active = true;
        setCurves(p, activePhones.length > 1);
    }
    updatePaths();
    updatePhoneTable();
    d3.selectAll("#phones div,.target")
        .filter(p=>p.id!==undefined)
        .call(setPhoneTr);
    if (!suppressVariant && p.fileNames && !p.copyOf) {
        table.selectAll("tr").filter(q=>q===p).select(".variants").node().focus();
    }
}

function removeCopies(p) {
    if (p.objs) {
        p.objs.forEach(q=>q.active=false);
        delete p.objs;
    }
    removePhone(p);
}
function removePhone(p) {
    p.active = p.pin = false; nextPN = null;
    activePhones = activePhones.filter(q => q.active);
    if (activePhones.length === 1) {
        setCurves(activePhones[0], false);
    }
    updatePaths();
    if (baseline.p && !baseline.p.active) { setBaseline(baseline0); }
    updatePhoneTable();
    d3.selectAll("#phones div,.target")
        .filter(q=>q===(p.copyOf||p))
        .call(setPhoneTr);
}

d3.json(DIR+"phone_book.json").then(function (brands) {
    let brandMap = {},
        inits = [],
        hasInit = typeof init_phones !== "undefined",
        isInit =  hasInit ? f => init_phones.indexOf(f) !== -1
                          : _ => false;
    brands.forEach(b => brandMap[b.name] = b);
    brands.forEach(function (b) {
        b.active = false;
        b.phoneObjs = b.phones.map(function (p) {
            let r = { brand:b, dispBrand:b.name };
            let init = -2;
            if (typeof p === "string") {
                r.phone = r.fileName = p;
            } else {
                r.phone = p.name;
                if (p.collab) {
                    r.dispBrand += " x "+p.collab;
                    r.collab = brandMap[p.collab];
                }
                let f = p.file || p.name;
                if (typeof f === "string") {
                    r.fileName = f;
                } else {
                    r.fileNames = f;
                    init = f.map(isInit).indexOf(true);
                    let ind = Math.max(0, init);
                    r.fileName = f[ind];
                    if (p.suffix) {
                        r.dispNames = p.suffix.map(
                            s => p.name + (s ? " "+s : "")
                        );
                    } else if (p.prefix) {
                        let reg = new RegExp("^"+p.prefix+"\s*", "i");
                        r.dispNames = f.map(n => {
                            n = n.replace(reg, "");
                            return p.name + (n.length ? " "+n : n);
                        });
                    }
                    r.dispName = (r.dispNames||r.fileNames)[ind];
                }
            }
            r.dispName = r.dispName || r.phone;
            r.fullName = r.dispBrand + " " + r.phone;
            if (init===-2 ? isInit(r.fileName) : init>=0) { inits.push(r); }
            return r;
        });
    });

    let allPhones = d3.merge(brands.map(b=>b.phoneObjs)),
        currentBrands = [];
    if (!hasInit) inits.push(allPhones[0]);
    inits.map(p => showPhone(p,0,1));

    function setClicks(fn) { return function (elt) {
        elt .on("mousedown", () => d3.event.preventDefault())
            .on("click", p => fn(p,!d3.event.ctrlKey))
            .on("auxclick", p => d3.event.button===1 ? fn(p,0) : 0);
    }; }

    let brandSel = d3.select("#brands").selectAll()
        .data(brands).join("div")
        .text(b => b.name + (b.suffix?" "+b.suffix:""))
        .call(setClicks(setBrand));

    let bg = (h,fn) => function (p) {
        d3.select(this).style("background", fn(p));
        (p.objs||[p]).forEach(q=>hl(q,h));
    }
    let phoneSel = d3.select("#phones").selectAll()
        .data(allPhones).join("div")
        .on("mouseover", bg(true, p => getDivColor(p.id===undefined?nextPhoneNumber():p.id, true)))
        .on("mouseout" , bg(false,p => p.id!==undefined?getDivColor(p.id,p.active):null))
        .call(setClicks(showPhone));
    phoneSel.append("span").text(p=>p.fullName);

    if (targets) {
        let b = { name:"Targets", active:false },
            ti = -targets.length,
            ph = t => ({
                isTarget:true, brand:b,
                dispName:t, phone:t, fullName:t+" Target", fileName:t+" Target"
            });
        let l = (text,c) => s => s.append("div").attr("class","targetLabel").append("span").text(text);
        let ts = b.phoneObjs = d3.select(".targets").call(l("Targets"))
            .selectAll().data(targets).join().call(l(t=>t.type))
            .style("flex-grow",t=>t.files.length).attr("class","targetClass")
            .selectAll().data(t=>t.files.map(ph))
            .join("div").text(t=>t.dispName).attr("class","target")
            .call(setClicks(showPhone))
            .data();
        ts.forEach((t,i)=>t.id=i-ts.length);
    }

    function setBrand(b, exclusive) {
        let incl = currentBrands.indexOf(b) !== -1;
        let hasBrand = (p,b) => p.brand===b || p.collab===b;
        if (exclusive || currentBrands.length===0) {
            currentBrands.forEach(br => br.active = false);
            if (incl) {
                currentBrands = [];
                phoneSel.style("display", null);
                phoneSel.select("span").text(p=>p.fullName);
            } else {
                currentBrands = [b];
                phoneSel.style("display", p => hasBrand(p,b)?null:"none");
                phoneSel.filter(p => hasBrand(p,b)).select("span").text(p=>p.phone);
            }
        } else {
            if (incl) return;
            if (currentBrands.length === 1) {
                phoneSel.select("span").text(p=>p.fullName);
            }
            currentBrands.push(b);
            phoneSel.filter(p => hasBrand(p,b)).style("display", null);
        }
        if (!incl) b.active = true;
        brandSel.classed("active", br => br.active);
    }

    let phoneSearch = new Fuse(
        allPhones,
        {
            shouldSort: false,
            tokenize: true,
            threshold: 0.2,
            minMatchCharLength: 2,
            keys: [
                {weight:0.3, name:"dispBrand"},
                {weight:0.1, name:"brand.suffix"},
                {weight:0.6, name:"phone"}
            ]
        }
    );
    let brandSearch = new Fuse(
        brands,
        {
            shouldSort: false,
            tokenize: true,
            threshold: 0.05,
            minMatchCharLength: 3,
            keys: [
                {weight:0.9, name:"name"},
                {weight:0.1, name:"suffix"},
            ]
        }
    );
    d3.select(".search").on("input", function () {
        d3.select(this).attr("placeholder",null);
        let fn, bl = brands;
        let c = currentBrands;
        let test = p => c.indexOf(p.brand )!==-1
                     || c.indexOf(p.collab)!==-1;
        if (this.value.length > 1) {
            let s = phoneSearch.search(this.value),
                t = c.length ? s.filter(test) : s;
            if (t.length) s = t;
            fn = p => s.indexOf(p)!==-1;
            let b = brandSearch.search(this.value);
            if (b.length) bl = b;
        } else {
            fn = c.length ? test : (p=>true);
        }
        phoneSel.style("display", p => fn(p)?null:"none");
        brandSel.style("display", b => bl.indexOf(b)!==-1?null:"none");
    });

    d3.select("#recolor").on("click", function () {
        allPhones.forEach(p => { if (!p.isTarget) { delete p.id; } });
        phoneNumber = 0; nextPN = null;
        activePhones.forEach(p => { if (!p.isTarget) { p.id = getPhoneNumber(); } });
        updatePaths();
        let c = p=>p.active?getDivColor(p.id,true):null;
        d3.select("#phones").selectAll("div")
            .style("background",c).style("border-color",c);
        let t = table.selectAll("tr").filter(p=>!p.isTarget)
            .style("color", c)
            .call(s => s.select(".remove").style("background-image",colorBar))
            .select("td:nth-child(3)"); // Key line
        t.select("svg").remove();
        t.append("svg").call(addKey);
    });
});

let pathHoverTimeout;
function pathHL(c, m, imm) {
    gpath.selectAll("path").classed("highlight", c ? d=>d===c   : false);
    table.selectAll("tr")  .classed("highlight", c ? p=>p===c.p : false);
    if (pathHoverTimeout) { clearTimeout(pathHoverTimeout); }
    clearLabels();
    pathHoverTimeout =
        imm ? pathTooltip(c, m) :
        c   ? setTimeout(pathTooltip, 400, c, m) :
        undefined;
}
function pathTooltip(c, m) {
    let g = gr.selectAll(".tooltip").data([c.id])
        .join("g").attr("class","tooltip");
    let t = g.append("text")
        .attrs({x:m[0], y:m[1]-6, fill:getTooltipColor(c)})
        .text(t=>t);
    let b = t.node().getBBox(),
        o = pad.l+W - b.width;
    if (o < b.x) { t.attr("x",o); b.x=o; }
    // Background
    g.insert("rect", "text")
        .attrs({x:b.x-1, y:b.y-1, width:b.width+2, height:b.height+2});
}
let interactInspect = false;
let graphInteract = imm => function () {
    let cs = d3.merge(activePhones.map(p=>p.hide?[]:p.activeCurves));
    if (!cs.length) return;
    let m = d3.mouse(this);
    if (interactInspect) {
        let ind = fr_to_ind(x.invert(m[0])),
            x1 = x(f_values[ind]),
            x0 = ind>0 ? x(f_values[ind-1]) : x1,
            sel= m[0]-x0 < x1-m[0],
            xv = sel ? x0 : x1;
        ind -= sel;
        function init(e) {
            e.attr("class","inspector");
            e.append("line").attrs({x1:0,x2:0, y1:pad.t,y2:pad.t+H});
            e.append("text").attr("class","insp_dB").attr("x",2);
        }
        let insp = gr.selectAll(".inspector").data([xv])
            .join(enter => enter.append("g").call(init))
            .attr("transform",xv=>"translate("+xv+",0)");
        let dB = insp.select(".insp_dB").text(f_values[ind]+" Hz");
        let cy = cs.map(c => [c, baseline.fn(c.l)[ind][1]+getOffset(c.p)]);
        cy.sort((d,e) => d[1]-e[1]);
        function newTooltip(t) {
            t.attr("class","tooltip")
                .attr("fill",d=>getTooltipColor(d));
            t.append("text").attr("x",2).text(d=>d.id);
            t.append("g").selectAll().data([0,1])
                .join("text")
                .attr("x",-16)
                .attr("text-anchor",i=>i?"start":"end");
            t.datum(function(){return this.getBBox();});
            t.insert("rect", "text")
                .attrs(b=>({x:b.x-1, y:b.y-1, width:b.width+2, height:b.height+2}));
        }
        let tt = insp.selectAll(".tooltip").data(cy.map(d=>d[0]), d=>d.id)
            .join(enter => enter.insert("g","line").call(newTooltip));
        let start = tt.select("g").datum((_,i) => cy[i][1])
            .selectAll("text").data(d => {
                let s=d<-0.05?"-":""; d=Math.abs(d)+0.05;
                return [s+Math.floor(d)+".",Math.floor((d%1)*10)];
            })
            .text(t=>t)
            .filter((_,i)=>i===0)
            .nodes().map(n=>n.getBBox().x-2);
        tt.select("rect")
            .attrs((b,i)=>({x:b.x+start[i]-1, width:b.width-start[i]+2}));
        // Now compute heights
        let hm = d3.max(tt.data().map(b=>b.height)),
            hh = (y.invert(0)-y.invert(hm-1))/2,
            stack = [];
        cy.map(d=>d[1]).forEach(function (h,i) {
            let n = 1;
            let overlap = s => h/n - s.h/s.n <= hh*(s.n+n);
            let l = stack.length;
            while (l && overlap(stack[--l])) {
                let s = stack.pop();
                h += s.h; n += s.n;
            }
            stack.push({h:h, n:n});
        });
        let ch = d3.merge(stack.map((s,i) => {
            let h = s.h/s.n - (s.n-1)*hh;
            return d3.range(s.n).map(k => h+k*2*hh);
        }));
        tt.attr("transform",(_,i) => "translate(0,"+(y(ch[i])+5)+")");
        dB.attr("y", y(ch[ch.length-1]+2*hh)+1);
    } else {
        let d = 30 * W0 / gr.node().getBoundingClientRect().width,
            sl= range_to_slice([-1,1],s=>m[0]+d*s);
        let ind = cs
            .map(c =>
                sl(baseline.fn(c.l))
                    .map(p => Math.hypot(x(p[0])-m[0], y(p[1]+getOffset(c.p))-m[1]))
                    .reduce((a,b)=>Math.min(a,b), d)
            )
            .reduce((a,b,i) => b<a[1] ? [i,b] : a, [-1,d])[0];
        pathHL(ind===-1 ? false : cs[ind], m, imm);
    }
}
function stopInspect() { gr.selectAll(".inspector").remove(); }
gr.append("rect")
    .attrs({x:pad.l,y:pad.t,width:W,height:H,opacity:0})
    .on("mousemove", graphInteract())
    .on("mouseout", ()=>interactInspect?stopInspect():pathHL(false))
    .on("click", graphInteract(true));

d3.select("#inspector").on("click", function () {
    clearLabels(); stopInspect();
    d3.select(this).classed("selected", interactInspect = !interactInspect);
});

d3.select("#expandTools").on("click", function () {
    let t=d3.select(".tools"), cl="collapse", v=!t.classed(cl);
    [t,d3.select(".targets")].forEach(s=>s.classed(cl, v));
});

d3.selectAll(".helptip").on("click", function() {
    let e = d3.select(this);
    e.classed("active", !e.classed("active"));
});