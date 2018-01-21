new Vue({
  el: "#js-main",
  data: {
    // points: [[100,0,'inner'],[2498,0,'inner'],[0,1190,'outer'],[152,0,'outer'],[0,-1185,'inner'],[251,0,'outer'],[0,-32, 'inner'],[871,0,'inner'],[0,440, 'outer'],[150,0,'outer'],[0,-670,'inner'],[1122,0,'inner'],[0,505,'outer'],[371,0,'inner'],[300,300, 'inner'],[0,2837,'inner'],[-1000,1000,'inner'],[-315,0,'outer'],[0,147,'inner'],[-50,0,'outer'],[0,50,'inner'],[-1650,0,'inner'],[0, -400,'outer'],[-50,0,'inner'],[0,-1013,'outer'],[-150,0,'outer'],[0,1215,'inner'],[-2300,0,'inner'],[-300,-200,'inner'],[0,-3800,'inner'],[100,-384,'inner']],
    points: [[200,-200],[200,0],[200,200],[0,200],[-200,200],[-200,0],[-200,-200],[0,-200],[200,-200]],
    x: { val: 0, sum: 0, min: 0 },
    y: { val: 0, sum: 0, min: 0 },

    lineId: 1,
    tab: 'start',

    plan: {
      width: 800,
      height: 800,
      translateAll: 20,
      orientation: 'vertical',
      currentColumn: -1,
      currentPanel: {},
      level: 'column'
    },

    angle: {
      inner: 'inner',
      outer: 'outer'
    },

    panel: {
      h: 1298,
      w: 282,
      col: 0,
      row: 0,
      type: 'symmetric',
      correction: [],
      tempCorrection: [],
      horizontal: 0,
      tempHorizontal: 0,
      dilatation: 15
    },

    mouseDrag: false,
    mouseDrop:  {
      x: 0,
      y: 0
    },

    double: false,

    calc: {
      whole: 0,
      cut: 0
    }
  },
  computed: {
    snap: function () {
      if(this.tab === 'visualization') {
        return Snap("#js-svg-visualization");
      }
    },
    panVisualization: function () {
      if (this.tab === 'visualization') {
        return svgPanZoom('#js-svg-visualization', {
          zoomEnabled: false,
          controlIconsEnabled: false,
          fit: true,
          center: true,
          minZoom: 0.5,
          maxZoom: 2,
          panEnabled: false,
          dblClickZoomEnabled: false
        });
      }
    },
    svgWidth: function() {
      return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    },
    svgHeight: function() {
      return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    },
    svgViewBox: function () {
      return this.x.min + " " + this.y.min + " " + (this.plan.width + this.x.min) + " " + (this.plan.width + this.y.min);
    },
    outlineLines: function () {
      var lines = [];
      var current = [this.points[0][0],this.points[0][1]];
      var next = current;
      for(var i = 1; i < this.points.length; i += 1) {
        next = [parseInt(current[0], 10) + parseInt(this.points[i][0],10), parseInt(current[1],10) + parseInt(this.points[i][1],10)];
        lines.push({
          x1: current[0],
          x2: next[0],
          y1: current[1],
          y2: next[1]
        });

        current = next;
      }

      return lines;
    },
    dilatationOutline: function () {
      var lines = [];
      var that = this;
      this.outlineLines.forEach(function (line) {
        lines.push(that.transpileLine(line, parseInt(that.panel.dilatation, 10)));
      });
      return lines;
    },
    roomOutline: function () {

      var d = "";
      this.points.forEach(function (point, index) {
        if(index === 0) {
          d += "M" + point[0] + "," + point[1];
        } else if(point[0] === 0) {
          d += " v " + point[1];
        } else if(point[1] === 0) {
          d += " h " + point[0]
        } else {
          d += " l " + point[0] + "," + point[1];
        }
      });

      return d + " z";
    },
    roomCoordinates: function() {
      var coords = [];
      this.points.forEach(function (el, i, arr) {
        if (i === 0) {
          coords.push(el);
        } else {
          coords.push([coords[i - 1][0] + el[0],coords[i - 1][1] + el[1]]);
        }
      });
      return coords;
    },
    panelWidth: function () {
      return (this.plan.orientation === 'vertical') ? this.panel.w : this.panel.h;
    },
    panelHeight: function () {
      return (this.plan.orientation === 'vertical') ? this.panel.h : this.panel.w;
    },
    ratio: function() {
      return this.plan.width / document.getElementById("js-svg-visualization").getBoundingClientRect().width;
    },
    columnsCount: function () {
      return this.plan.orientation === 'vertical' ? Math.ceil(this.x.sum / this.panel.w) + 2 : Math.ceil(this.y.sum / this.panel.w) + 2;
    },
    rowsCount: function () {
      return this.plan.orientation === 'vertical' ? Math.ceil(this.y.sum / this.panel.h) + 2 : Math.ceil(this.x.sum / this.panel.h) + 2;
    },
    widthDifference: function () {
      return this.plan.orientation === 'vertical' ? this.x.sum % this.panelWidth : this.y.sum % this.panelHeight;
    },
    heightDifference: function () {
      return this.plan.orientation === 'vertical' ? this.y.sum % this.panelHeight : this.x.sum % this.panelWidth;
    }
  },
  methods: {
    setTab: function (tab) {
      this.tab = tab;

    },
    calculateLineAngle: function(line) {
      var referencePoint = {
        x: line.x1 - 10,
        y: line.y1
      };

      var AB = Math.sqrt(Math.pow(line.x1 - referencePoint.x, 2) + Math.pow(line.y1 - referencePoint.y, 2));
      var BC = Math.sqrt(Math.pow(line.x1 - line.x2, 2) + Math.pow(line.y1 - line.y2, 2));
      var AC = Math.sqrt(Math.pow(line.x2 - referencePoint.x,2) + Math.pow(line.y2 - referencePoint.y, 2));

      return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
    },
    transpileDiagonalLine: function (line, distance, angle) {
      if(line.x1 > line.x2 && line.y1 < line.y2) {
        distance = -distance;
      } else if(line.y1 > line.y2) {
        angle -= 1.5708;
      }

      var temp = {
        x1: line.x1 + (Math.cos(angle) * distance),
        y1: line.y1 + (Math.sin(angle) * distance),
        x2: line.x2 + (Math.cos(angle) * distance),
        y2: line.y2 + (Math.sin(angle) * distance)
      };

      return {
        x1: temp.x1 - (temp.x2 - temp.x1),
        y1: temp.y1 - (temp.y2 - temp.y1),
        x2: temp.x2 + (temp.x2 - temp.x1),
        y2: temp.y2 + (temp.y2 - temp.y1)
      }
    },
    transpileHorizontalLine: function(line, distance) {
      if(line.y1 < line.y2) {
        distance = -distance;
      }
      return {
        x1: line.x1 + distance,
        y1: line.y1 + (2 * distance),
        x2: line.x2 + distance,
        y2: line.y2 - (2 * distance)
      }
    },
    transpileVerticalLine: function (line, distance) {
      if(line.x1 > line.x2) {
        distance = -distance;
      }
      return {
        x1: line.x1 - (2 * distance),
        y1: line.y1 + distance,
        x2: line.x2 + (2 * distance),
        y2: line.y2 + distance
      }
    },
    transpileLine: function (line, distance) {
      if(line.x1 === line.x2) {
        return this.transpileHorizontalLine(line, distance);
      } else if(line.y1 === line.y2) {
        return this.transpileVerticalLine(line, distance);
      } else {
        return this.transpileDiagonalLine(line, distance, this.calculateLineAngle(line));
      }
    },
    addPoint: function() {
      this.points.push([parseInt(this.x.val, 10), parseInt(this.y.val, 10)]);
      this.resetInput();
      this.registerInput();
    },
    registerInput: function () {
      var x = {min: 0, max: 0, sum: 0};
      var y = {min: 0, max: 0, sum: 0};

      this.points.forEach(function (point) {
        x.sum += parseInt(point[0], 10);
        y.sum += parseInt(point[1], 10);
        x.min = Math.min(x.min, x.sum);
        x.max = Math.max(x.sum, x.max);
        y.min = Math.min(y.min, y.sum);
        y.max = Math.max(y.sum, y.max);
      });

      this.x.min =  x.min;
      this.y.min =  y.min;
      this.y.sum = Math.abs(y.min) + Math.abs(y.max);
      this.x.sum = Math.abs(x.min) + Math.abs(x.max);
    },
    getPanelCoordinates: function (x, y) {
      var coords = [];
      var w = this.panelWidth;
      var h = this.panelHeight;
      coords.push([x, y]);
      coords.push([x + w, y]);
      coords.push([x + w, y + h]);
      coords.push([x, y + h]);
      coords.push([x, y]);
      return coords;
    },
    getInnerPanelCoordinates: function(x,y) {
      var coords = [];
      var w = this.panelWidth - 2;
      var h = this.panelHeight - 2;
      coords.push([x + 1, y + 1]);
      coords.push([x + w, y + 1]);
      coords.push([x + w, y + h]);
      coords.push([x + 1, y + h]);
      coords.push([x + 1, y + 1]);
      return coords;
    },
    getLineId: function () {
      currentId = "svg-line-" + this.lineId;
      this.lineId += 1;

      return currentId;
    },
    resetInput: function () {
      this.x.val = 0;
      this.y.val = 0;
    },
    getPanelX: function (item) {
      if (this.plan.orientation === 'vertical') {
        return (item.x + parseInt(this.panel.horizontal, 10));
      } else {
        return (item.y + this.getCorrection(item.col + 1));
      }
    },
    getPanelY: function (item) {
      if (this.plan.orientation === 'vertical') {
        return (item.y + this.getCorrection(item.col + 1));
      } else {
        return (item.x + parseInt(this.panel.horizontal, 10));
      }
    },
    rotatePlan: function () {
      if (this.plan.orientation === 'vertical') {
        this.plan.orientation = 'horizontal';
      } else {
        this.plan.orientation = 'vertical';
      }
    },
    getCorrection: function(n) {
      var corr = parseInt(this.panel.correction[n], 10);
      return isNaN(corr) ? 0 : corr;
    },
    getPanels: function() {
      var panels = [];

      for(var col = -1; col < this.columnsCount - 1; col += 1) {
        if(typeof this.panel.correction[col] === 'undefined') {
          this.panel.correction[col] = 0;
        }
        for(var row = -1; row < this.rowsCount - 1; row += 1) {
          panels.push({
            x: col * this.panel.w,
            y: row * this.panel.h,
            col: col,
            row: row
          })
        }
      }

      return panels;
    },
    turfConvert: function (arr) {
      var d = "";
      for(var i = 0; i < arr.length; i += 1) {
        if(i === 0) {
          d += "M" + arr[0][0] + "," + arr[0][1];
        } else {
          if(arr[i - 1][0] === arr[i][0]) {
            d += " H" + (arr[i][0]);
          } else if(arr[i - 1][1] === arr[i][1]) {
            d += " V" + (arr[i][1]);
          }
        }
      }
      return d + ' z';
    },
    mouseDown: function (event) {
      event.preventDefault();

      var that = this;
      console.log(this.snap);
      var panel = event.srcElement || event.originalTarget;

      this.plan.currentColumn = parseInt(panel.dataset.col, 10);
      this.plan.currentPanel.style = '';
      this.plan.currentPanel.style = '';
      this.plan.currentPanel = panel;

      if(this.plan.level === 'element') {

        var room = this.roomCoordinates;
        var pan = this.getPanelCoordinates(parseInt(panel.getAttribute('x'), 10), parseInt(panel.getAttribute('y'), 10));

        var p1 = turf.polygon([room]);
        var p2 = turf.polygon([pan]);

        var difference = turf.difference(p2,p1);
        if(difference !== null) {
          var parts = difference.geometry.coordinates;
          var diff = turf.polygon([parts[0]]);
          var proper = turf.difference(p2, diff).geometry.coordinates;
          proper.forEach(function (el, i, arr) {

            var con = that.turfConvert(arr.length > 1 ? el[0] : el);

            var x = that.snap.path(con);
            x.attr('fill', 'blue');
          });
        }
      }

      panel.style = 'stroke-width: 10';

      this.mouseDrop.x = event.clientX;
      this.mouseDrop.y = event.clientY;
      this.panel.tempCorrection = this.panel.correction.slice();
      this.panel.tempHorizontal = this.panel.horizontal;
      this.mouseDrag = true;

    },
    mouseUp: function (event) {
      this.mouseDrag = false;
    },
    mouseMove: function (event) {
      if(this.mouseDrag) {
        var x = Math.round(this.panel.tempHorizontal + ((event.clientX - this.mouseDrop.x) * this.ratio));
        var y = Math.round(this.panel.tempCorrection[this.plan.currentColumn + 1] + ((event.clientY - this.mouseDrop.y) * this.ratio));

        if(this.plan.level === 'group') {
          this.setHorizontal(this.plan.orientation === 'vertical' ? x : y);
        } else if(this.plan.level === 'column') {
          this.setVertical(this.plan.orientation === 'vertical' ? y : x, this.plan.currentColumn);
        }
      }
    },
    horizontalMove: function(event) {
      var val = event.target.value;
      this.setHorizontal(val);
    },
    verticalMove: function (event) {
      var val = event.target.value;
      var col = parseInt(event.target.getAttribute('data-col'), 10);
      this.setVertical(val, col + 1);
    },
    setVertical: function(val, col) {
      
      
      if(val < this.panelHeight && val > (-2 * this.panelHeight) + this.heightDifference) {
        Vue.set(this.panel.correction, parseInt(col) + 1, val);
      } else if(val >= this.panelHeight) {
        Vue.set(this.panel.correction, parseInt(col) + 1, this.panelHeight);
      } else {
        Vue.set(this.panel.correction, parseInt(col) + 1,  (-2 * this.panelHeight) + this.heightDifference);
      }
    },
    setHorizontal: function(val) {
      if(val < this.panelWidth && val > (-2 * this.panelWidth) + this.widthDifference) {
        Vue.set(this.panel, 'horizontal', val);
      } else if(val >= this.panelWidth) {
        Vue.set(this.panel, 'horizontal', this.panelWidth);
      } else {
        Vue.set(this.panel, 'horizontal', (-2 * this.panelWidth) + this.widthDifference);
      }
    },
    doubleClick: function () {

    },
    setLevel: function(lvl) {
      if(this.plan.level === "plan" && lvl !== "plan") {
        this.disableVisualizationPan();
      } else if(lvl === "plan") {
        this.enableVisualizationPan();
      }
      this.plan.level = lvl;
    },
    toggleVisualizationPan: function () {
      if (this.panVisualization.isPanEnabled()) {
        this.disableVisualizationPan();
      } else {
        this.enableVisualizationPan();
      }
    },
    enableVisualizationPan: function () {
      this.panVisualization.enableDblClickZoom();
      this.panVisualization.enablePan();
      this.panVisualization.enableZoom();
    },
    disableVisualizationPan: function () {
      this.panVisualization.disableDblClickZoom();
      this.panVisualization.disablePan();
      this.panVisualization.disableZoom();
    },
    calculatePanels: function() {
      var that = this;
      var whole = 0;
      var cut = 0;
      var all = 0;
      var other = 0;

      var room = turf.polygon([this.roomCoordinates]);
      this.getPanels().forEach(function(item) {
        var panel = turf.polygon([that.getInnerPanelCoordinates(item.x, item.y)]);
        var diff = turf.difference(panel,room);

        if(turf.booleanContains(room, panel)) {
          var a = document.getElementById("svg-panel-" + item.col + "-" + item.row);
          a.setAttribute('style','fill: blue');
          whole += 1;
        } else if(!turf.booleanOverlap(panel, diff)) {
          var a = document.getElementById("svg-panel-" + item.col + "-" + item.row);
          a.setAttribute('style','fill: red');
          other += 1;
        } else {
          var a = document.getElementById("svg-panel-" + item.col + "-" + item.row);
          a.setAttribute('style','fill: green');
          cut += 1;

          console.log('----');
          console.log(panel);
          console.log(diff);
        }
        all += 1;
      });
      console.log(all);
      console.log(other);
      Vue.set(this.calc, 'whole', whole);
      Vue.set(this.calc, 'cut', cut);
    },
    shiftPath: function (outline, shift) {
      var shiftedPath = [];
      outline.forEach(function (el, index) {
          if(index === 0) {
            var newEl = [
              el[0] + shift,
              el[1] + shift,
              el[2]
            ];
            shiftedPath.push(newEl);
          }
      });
    }
  },
  updated: function () {

    var pan = svgPanZoom('#js-svg', {
      zoomEnabled: true,
      controlIconsEnabled: false,
      fit: true,
      center: false,
      minZoom: 0.5,
      maxZoom: 10
    });

  }
});