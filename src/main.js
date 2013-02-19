require.config({
  shim: {
    underscore: {
      exports: '_'
    },
  },
  paths: {
    moment: "../lib/moment.min",
    underscore: "../lib/underscore"
  }
});

require(["timecalc"], function(timecalc) {
});
