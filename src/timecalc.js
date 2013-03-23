/*jslint browser: true*/
/*global $, jQuery, moment*/

define(["jquery", "knockout", "util", "moment"], function($, ko, util) {
  'use strict';

  var HOUR_PRECISION = 2;

  /**
   * The entire model, which primarily is represented by TimeSheetRows.
   */
  function TimeSheetModel(options) {
    var self = this,
        _callback = options.callback;

    // rows in the timesheet table
    self.rows = ko.observableArray();
    self.addRow = function() {
      self.rows.push(new TimeSheetRow("", "", ""));
    };
    self.getLastRow = function() {
      return self.rows()[self.rows().length-1];
    }
    self.grandTotal = ko.computed(function () {
      var total = 0;
      self.rows().forEach(function (x) {
        // ignore if blank, NaN, undefined, etc. (or 0)
        if (x.rowTotal()) {
          total += parseFloat(x.rowTotal());
        }
      });
      return total.toFixed(HOUR_PRECISION);
    });
    self.clearClick = function () {
      self.init();
    };
    self.init = function () {
      self.rows.removeAll();
      self.addRow();
      self.addRow();
      self.addRow();
      focusOnFirst(true);
      onEnterAdvanceFocus();
    };
    // perform bindings as 2nd to last step
    _callback(self);
    self.init();
  };

  /**
   * A single row: two InputTimes, a break time and total.
   */
  function TimeSheetRow(timeIn, timeOut, breakLen) {
    var self = this;
    // objects holding all data for time in and time out
    var t1 = new InputTime(timeIn);
    var t2 = new InputTime(timeOut, t1);
    // visible reference to underlying observable
    self.timeIn = t1.computed;
    self.timeOut = t2.computed;
    self.breakLen = ko.observable(breakLen);
    self.rowTotal = ko.computed(function () {
      // we have to reference timeIn and timeOut just to create a dependency
      // upon them, even though we are actually going to pull values from the
      // underlying, pre-parsed value
      if (self.timeIn() === "" || self.timeOut() === "") {
        return "";
      }
      var blen = parseFloat(self.breakLen()) || 0;
      var total = (t2.val - t1.val - blen).toFixed(HOUR_PRECISION);
      return total;
    });
    self.cellClick = function (data, event) {
      event.target.select();
    };
    self.cellBlur = function (data, event) {
      // add row if the last row has a non-empty total
      if (viewModel !== undefined && self === viewModel.getLastRow() && 
          self.rowTotal() !== "") {
        viewModel.addRow();
      }
    }
  };

  /**
   * A single cell representing a time. Holds the observable which is in the
   * view as well as the parsed value.
   */
  function InputTime(time, refInputTime) {
    var self = this;
    // we store some values alongside ko's computed observable. 
    // an alternative design would be to store those values
    // within the observable. XXX: which is cleaner?
    self.val = 0;
    // reference the input time (if any) so that we can check its value
    // to make inferences about this time
    self.refInputTime = refInputTime;
    // in order to parse the user's input then update the value in that
    // same field (e.g. 3 -> 3pm) we store updated value in another field
    // called '_raw'. 
    // (e.g., computed.write() -> _raw.write() -> computed.read() )
    // There's a problem though if they type in the same
    // time (e.g. it's 3:00pm and they type '3' so it just stays as 3 because
    // this callback isn't triggered). To get around this we set notify always.
    self._raw = ko.observable(time).extend({ notify: "always" });
    // value bound to the input. 
    self.computed = ko.computed({
      read: function() { 
        return self._raw(); 
      },
      // when user types in text, we parse it and update our model
      write: function(value) {
        // extract the value of refTime if defined
        var refTime = self.refInputTime && self.refInputTime.val
        var t1a = util.parseTime(value, refTime);
        if (t1a === undefined) {
          self._raw("");
        } else {
          // update the value FIRST, then the raw, to trigger a total update
          self.val = t1a[0];
          self._raw(t1a[1]);
        }
      } 
    });
    self.computed(time);
  }
    
  /** 
   * Auto-focus on the first input.
   */
  function focusOnFirst(doSelect) {
    // the total shows up in HTML before the days so we must
    // filter the selection
    var item = $('.day input:visible:first').first().focus();
    if (doSelect === true) {
      item.select();
    }
  }

  /**
   * "Enter" should go to the next input field like tab.
   */
  function onEnterAdvanceFocus() {
    $("input").bind('keypress', function (event) {
      if (event.keyCode === 13) {
        var $set = $('input'),
          $next = $set.eq($set.index(this) + 1);
        $next.focus();
      }
    });
  }

  // create model and initialize
  //var viewModel = new TimeSheetModel({callback: function(c) { 
  //  ko.applyBindings(c); 
  //}});

  return {
    TimeSheetModel: TimeSheetModel
  }
});
