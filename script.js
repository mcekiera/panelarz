var app = new Vue({
  el: "#js-main",
  data: {
    points: [[0,0]],
    prev: [0,0],
    lines: [],
    x: { val: 0, sum: 0, min: 0 },
    y: { val: 0, sum: 0, min: 0 },
    lineId: 1,
    tab: 'start',
    plan: {
      width: 10000,
      height: 10000
    }
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
      return "0 0 " + (this.getSvgWidth > window.innerWidth ? this.getSvgWidth : window.innerWidth) + " " + (this.getSvgHeight > 800 ? this.getSvgHeight() : 800);
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
      console.log(this.lineId);
      return currentId;
    },
    resetInput: function () {
      this.x.val = 0;
      this.y.val = 0;
    }
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
    pan.zoom(1);
  }
});