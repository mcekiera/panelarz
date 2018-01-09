var app = new Vue({
  el: "#js-main",
  data: {
    points: [],
    lines: [],
    x: 0,
    y: 0
  },
  methods: {
    addPoint: function() {
      this.points.push([this.x, this.y]);
      if(this.points.length > 1) {
        var key = this.points.length;
        this.lines.push([this.points[key-2].concat(this.points[key - 1])]);
      }
    }
  }
});