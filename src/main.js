require.config({
  paths: {
    "moment": "../lib/moment.min",
    "knockout": "../lib/knockout-2.2.1",
  }
});

require(["timecalc"], function(timecalc) {
  // it initializes itself now.
});
