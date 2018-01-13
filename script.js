var app = new Vue({
  el: "#js-main",
  data: {
    // M0,0 h2498 v1190 h152 v-1185 h251 v-32 h871 v440 h150 v-670 h1122 v505 h671 v4137 h-1315 v197 h-1750 v-1413 h-150 v1215 h-2498 v-4385"></path>
    points: [[0,0],[2498,0],[0,1190],[152,0],[0,-1185],[251,0],[0,-32],[871,0],[0,440],[150,0],[0,-670],[1122,0],[0,505],[671,0],[0,4137],[-1315,0],[0,147],[-50,0],[0,50],[-1650,0],[0, -400],[-50,0],[0,-1013],[-150,0],[0,1215],[-2498,0],[0,-4385]],
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
    getAbsolutePoints: function() {
      var absolutePoints = [];

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
      if (this.orientation === 'vertical') {
        return 'M' + (item.x + parseInt(this.panel.horizontal, 10)) + ',' + (item.y + this.getCorrection(item.col + 1)) + ' h' + this.panel.w + ' v' + this.panel.h + ' h-' + this.panel.w + ' v-' + this.panel.h + ' z';
      } else {
        return 'M' + (item.y + this.getCorrection(item.col + 1)) + ' ' + (item.x + parseInt(this.panel.horizontal, 10)) + ' h' + this.panel.h + ' v' + this.panel.w + ' h-' + this.panel.h + ' v-' + this.panel.w + ' z';
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
      panel.style = 'stroke-width: 10';

      var room = Snap.path.toAbsolute(Snap('#svg-room-outline-in'));
      var pan = Snap.path.toAbsolute(Snap('#' + panel.getAttribute('id')));

      panel.parentNode.appendChild(panel);
      var inter = Snap.path.intersection(pan ,room);
      if(inter.length !== 0) {
        var sameSide = inter[0].segment2 === inter[1].segment2;


        console.log(pan);
        // console.log(room);
        // if(inter[0].segment1 == 4) {
        //   pan[inter[0].segment1] = pan[inter[0].segment1][0] === "H" ? ["H", Math.round(inter[0].x)] : ["V", Math.round(inter[0].y)];
        //   pan[inter[1].segment1] = pan[inter[1].segment1][1] === "H" ? ["H", Math.round(inter[1].x)] : ["V", Math.round(inter[1].y)];
        //   pan.splice(inter[1].segment1 + 1, 0, room[inter[1].segment2][0] === "H" ? ["H", Math.round(inter[1].x)] : ["V", Math.round(inter[1].y)]);
        // } else if(inter[0].segment1 == 3) {

        if (inter[0].segment2 === inter[1].segment2 - 1) {
          pan[inter[0].segment1] = pan[inter[0].segment1][0] === "H" ? ["H", Math.round(inter[0].x)] : ["V", Math.round(inter[0].y)];
          pan = pan.slice(0, inter[0].segment1 + 1).concat(room.slice(inter[0].segment2, inter[1].segment2).concat(pan.slice(inter[0].segment1 + 1)));
          pan.splice(inter[1].segment1 + 1, 0, room[inter[1].segment2][0] === "H" ? ["H", Math.round(inter[1].x)] : ["V", Math.round(inter[1].y)]);
        } else if(inter[0].segment1 === inter[1].segment1) {
          pan.splice(inter[0].segment1, 0, pan[inter[0].segment1][0] === "H" ? ["H", Math.round(inter[0].x)] : ["V", Math.round(inter[0].y)]);
          pan.splice(inter[0].segment1 + 1, 0, pan[inter[1].segment1 - 1][0] === "H" ? ["H", Math.round(inter[0].x)] : ["V", Math.round(inter[0].y)]);
          pan = pan.slice(0, inter[0].segment1 + 1).concat(room.slice(inter[0].segment2, inter[1].segment2).concat(pan.slice(inter[0].segment1 + 1)));
        } else if(inter[0].segment2 === inter[1].segment2) {
          pan[inter[0].segment1] = pan[inter[0].segment1][0] === "H" ? ["H", Math.round(inter[0].x)] : ["V", Math.round(inter[0].y)];
        } else if(!sameSide) {
          pan[inter[0].segment1] = pan[inter[0].segment1][0] === "H" ? ["H", Math.round(inter[0].x)] : ["V", Math.round(inter[0].y)];
          pan = pan.slice(0,inter[0].segment1 + 1).concat(room.slice(inter[0].segment2, inter[1].segment2).concat(pan.slice(inter[0].segment1 + 1)));
        }
        //
        // }

        console.log(pan);

        Snap("#js-svg-visualization").select('#svg-panel-surface').path(pan.map(function (el) {
          return el.join(" ");
        }).join(" ").replace(/^L[\d\s,-]*M/, 'M')).attr('stroke',"green").attr('strokeWidth',1).attr('fill','green');

        console.log(pan.map(function (el) {
          return el.join(" ");
        }).join(" ").replace(/^L[\d\s,-]*M/, 'M'));
      }


      //
      // var seg1_1, seg1_2;
      // if(inter[0].segment1 > inter[1].segment1) {
      //   seg1_1 = inter[0].segment1 - 1;
      //   seg1_2 = inter[1].segment1 - 1;
      // } else {
      //   seg1_1 = inter[1].segment1 - 1;
      //   seg1_2 =  inter[0].segment1 - 1;
      // }
      //
      //
      // var newPath = "";
      // for (var i = 0; i < pan.node.pathSegList.length; i += 1) {
      //   if(i >= seg1_2 && i <= seg1_1) {
      //     switch (pan.node.pathSegList[i].pathSegTypeAsLetter) {
      //       case "M":
      //         newPath += "M" + pan.node.pathSegList[i].x + "," + pan.node.pathSegList[i].y;
      //         break;
      //       case "h":
      //         newPath += " h" + pan.node.pathSegList[i].x;
      //         break;
      //       case "v":
      //         newPath += " v" + pan.node.pathSegList[i].y;
      //         break;
      //       case "z":
      //         newPath += " z";
      //     }
      //   }
      // }
      // console.log(newPath);
      //
      // var newPath2 = "";
      // for (var i = 0; i < room.node.pathSegList.length; i += 1) {
      //   switch (room.node.pathSegList[i].pathSegTypeAsLetter) {
      //     case "M":
      //       newPath2 += "M" + room.node.pathSegList[i].x + "," + room.node.pathSegList[i].y;
      //       break;
      //     case "h":
      //       newPath2 += " h" + room.node.pathSegList[i].x;
      //       break;
      //     case "v":
      //       newPath2 += " v" + room.node.pathSegList[i].y;
      //       break;
      //     case "z":
      //       newPath2 += " z";
      //   }
      // }
      // console.log(newPath2);
      //

      console.log(inter);
      var trans = this.translateAll;
      inter.forEach(function (el) {
        Snap("#js-svg-visualization").circle(el.x + trans, el.y + trans, 5).attr('fill','blue')
      });


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