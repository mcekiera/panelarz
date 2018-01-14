var app = new Vue({
  el: "#js-main",
  data: {
    // M0,0 h2498 v1190 h152 v-1185 h251 v-32 h871 v440 h150 v-670 h1122 v505 h671 v4137 h-1315 v197 h-1750 v-1413 h-150 v1215 h-2498 v-4385"></path>
    points: [[0,0],[2498,0],[0,1190],[152,0],[0,-1185],[251,0],[0,-32],[871,0],[0,440],[150,0],[0,-670],[1122,0],[0,505],[671,0],[0,4137],[-1315,0],[0,147],[-50,0],[0,50],[-1650,0],[0, -400],[-50,0],[0,-1013],[-150,0],[0,1215],[-2500,0],[0,-4384]],
    lines: [],
    x: { val: 0, sum: 0, min: 0 },
    y: { val: 0, sum: 0, min: 0 },

    lineId: 1,
    tab: 'start',

    plan: {
      width: 6000,
      height: 6000
    },

    ratio: 1,

    panel: {
      h: 1298,
      w: 282,
      col: 0,
      row: 0,
      type: 'symmetric',
      correction: [],
      tempCorrection: [],
      horizontal: 0,
      tempHorizontal: 0
    },
    mouseDrag: false,
    mouseDrop:  {
      x: 0,
      y: 0
    },
    translateAll: 20,
    double: false,
    currentColumn: -1,
    currentPanel: {},
    orientation: 'vertical',
    level: 'column'
  },
  methods: {
    setTab: function (tab) {
      this.tab = tab;

    },
    addPoint: function() {
      var xNew = parseInt(this.x.val, 10);
      var yNew = parseInt(this.y.val, 10);

      var newPoint = [xNew, yNew];
      this.points.push(newPoint);

      this.resetInput();
      this.registerInput();
    },
    getLines: function() {
      var lines = [];
      var current = [0,0];
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
    getSvgWidth: function() {
      return window.innerWidth;
    },
    getSvgHeight: function() {
      return window.innnerHeight ? window.innerHeight : 800;
    },
    getViewBox: function () {
      return "0 0 " + this.plan.width + " " + this.plan.width;
    },
    getTransform: function () {
      return "translate(" + Math.abs(this.x.min < 0 ? this.x.min - 10 : 0) + "," + Math.abs(this.y.min < 0 ? this.y.min - 10 : 0) + ")";
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
    getRoomCoordinates: function() {
      var coords = [];
      this.points.forEach(function (el, i, arr) {
        if (i === 0) {
          coords.push(el);
        } else {
          coords.push([coords[i - 1][0] + el[0],coords[i - 1][1] + el[1]]);
        }
      });
      // console.log(coords);
      return coords;
    },
    getPanelCoordinates: function (x, y) {
      var coords = [];
      var w = (this.orientation === 'vertical') ? this.panel.w : this.panel.h;
      var h = (this.orientation === 'vertical') ? this.panel.h : this.panel.w;
      coords.push([x,y]);
      coords.push([x + w,y]);
      coords.push([x + w,y + h]);
      coords.push([x,y + h]);
      coords.push([x,y]);
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
    getRoomOutline: function () {
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
    getPanelOutline: function(item) {
      var h = (this.orientation === 'vertical') ? this.panel.w : this.panel.h;
      var w = (this.orientation === 'vertical') ? this.panel.h : this.panel.w;
      return 'M' + this.getPanelX(item) + ',' + this.getPanelY(item) + ' h' + h + ' v' + w + ' h-' + h + ' v-' + w + ' z';
    },
    getPanelX: function (item) {
      if (this.orientation === 'vertical') {
        return (item.x + parseInt(this.panel.horizontal, 10));
      } else {
        return (item.y + this.getCorrection(item.col + 1));
      }
    },
    getPanelY: function (item) {
      if (this.orientation === 'vertical') {
        return (item.y + this.getCorrection(item.col + 1));
      } else {
        return (item.x + parseInt(this.panel.horizontal, 10));
      }
    },
    rotateOutline: function () {
      if (this.orientation === 'vertical') {
        this.orientation = 'horizontal';
      } else {
        this.orientation = 'vertical';
      }
    },

    getCorrection: function(n) {

      var corr = parseInt(this.panel.correction[n], 10);
      return isNaN(corr) ? 0 : corr;
    },

    getPanels: function() {
      this.panel.col = this.orientation === 'vertical' ? Math.round(this.x.sum / this.panel.w) + 2 : Math.round(this.y.sum / this.panel.w) + 2;
      this.panel.row = this.orientation === 'vertical' ? Math.round(this.y.sum / this.panel.h) + 2 : Math.round(this.x.sum / this.panel.h) + 2;
      var panels = [];

      for(var col = -1; col < this.panel.col - 1; col += 1) {
        if(typeof this.panel.correction[col] === 'undefined') {
          this.panel.correction[col] = 0;
        }
        for(var row = -1; row < this.panel.row - 1; row += 1) {
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
    mouseDown: function (event) {
      event.preventDefault();
      this.ratio = this.plan.width / document.getElementById("js-svg-visualization").getBoundingClientRect().width;

      var panel = event.srcElement || event.originalTarget;
      this.currentColumn = parseInt(panel.dataset.col, 10);
      this.currentPanel.style = '';
      this.currentPanel.style = '';
      this.currentPanel = panel;
      if(this.level === 'element') {

        var room = this.getRoomCoordinates();
        var pan = this.getPanelCoordinates(parseInt(panel.getAttribute('data-x'), 10), parseInt(panel.getAttribute('data-y'), 10));
        // console.log(room);
        // console.log(pan);

        var p1 = turf.polygon([room]);
        var p2 = turf.polygon([pan]);

        console.log(turf.booleanWithin(p2, p1));
        function convert(arr) {
          var d = "";
          for(var i = 0; i < arr.length; i += 1) {
            if(i === 0) {
              d += "M" + arr[i][0] + "," + arr[i][1];
            } else {
              if(arr[i - 1][0] === arr[i][0]) {
                d += " H" + arr[i][0]
              } else if(arr[i - 1][1] === arr[i][1]) {
                d += " V" + arr[i][1]
              }
            }
          }
          return d + ' z';
        }

        var snap = Snap("#js-svg-visualization");
        var difference = turf.difference(p2,p1);
        if(difference !== null) {
          var parts = difference.geometry.coordinates;
          console.log(parts);
          // console.log(parts[0]);
          var diff = turf.polygon([parts[0]]);
          var proper = turf.difference(p2, diff).geometry.coordinates;
          // console.log(proper);
          proper.forEach(function (el, i, arr) {
            console.log(el);
            var con = convert(arr.length > 1 ? el[0] : el);
            console.log(con);
            var x = snap.select('#svg-panel-surface').path(con);
            x.attr('fill', 'blue');
          });
        }
      }

      panel.style = 'stroke-width: 10';

      // var inter = Snap.path.intersection(pan ,room);
      // if(inter.length !== 0) {
      //
      // }
      //
      // console.log(inter);
      // var trans = this.translateAll;
      // inter.forEach(function (el) {
      //   Snap("#js-svg-visualization").circle(el.x + trans, el.y + trans, 5).attr('fill','blue')
      // });


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
        var x = this.panel.tempHorizontal + ((event.clientX - this.mouseDrop.x) * this.ratio);
        var y = this.panel.tempCorrection[this.currentColumn + 1] + ((event.clientY - this.mouseDrop.y) * this.ratio);

        if(this.level === 'group') {
          Vue.set(this.panel, 'horizontal', this.orientation === 'vertical' ? x : y);
        } else if(this.level === 'column') {
          Vue.set(this.panel.correction, this.currentColumn + 1, this.orientation === 'vertical' ? y : x);
        }
      }
    },
    doubleClick: function () {
      if (this.level === 'group') {
        this.level = 'column';
      } else if(this.level === 'column') {
        this.level = 'element';
      } else {
        this.level = 'group';
      }

    },

    // setCurrentPanel: function (event) {
    //   var panel = event.srcElement;
    //   this.currentColumn = parseInt(panel.dataset.col, 10);
    //
    //   this.currentPanel = panel;
    //
    // }
  },
  updated: function () {

    var pan = svgPanZoom('#js-svg', {
      zoomEnabled: true,
      controlIconsEnabled: false,
      fit: false,
      center: false,
      minZoom: 0.5,
      maxZoom: 2
    });
  }
});