require.config({
  paths: {
    "moment": "../lib/moment.min",
  }
});

require(["timecalc"], function(timecalc) {
  timecalc.init();
});
