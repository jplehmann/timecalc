/*jslint browser: true*/
/*global $, jQuery, moment*/

define(["jquery", "knockout", "util", "moment"], function($, ko, util) {
  'use strict';

  var HOUR_PRECISION = 2;

  /**
   * The entire model which primarily is represented by TimeSheetRows.
   */
  function TimeSheetModel(rows) {
    var self = this;
    self.rows = ko.observableArray();
    self.addRow = function(row) {
      self.rows.push(new TimeSheetRow("", "", ""));
    };
    self.removeRow = function(row) {
        self.row.remove(row);
    };
    self.getLastRow = function() {
      return self.rows()[self.rows().length-1];
    }
    self.grandTotal = ko.computed(function () {
      var total = 0;
      self.rows().forEach(function (x) {
        // assume it's an hour total
        // ignore if blank, NaN, undefined, etc. (or 0)
        if (x.rowTotal()) {
          total += parseFloat(x.rowTotal());
        }
      });
      return total.toFixed(HOUR_PRECISION);
    });
    self.clearClick = function () {
      // reinitialize
      self.init();
    };
    // XXX: should this be inside this class or outside?
    self.init = function () {
      self.rows.removeAll();
      // TODO: how to pass this in at once?
      self.rows.push(new TimeSheetRow("9am", "5pm", "0.25"));
      self.rows.push(new TimeSheetRow("9am", "5pm", "0.25"));
      self.rows.push(new TimeSheetRow("", "", ""));
      focusOnFirst(true);
      enterAdvancesField();
    };
  };

  /**
   * A single row: two InputTimes, a break time and total.
   */
  function TimeSheetRow(timeIn, timeOut, breakLen) {
    var self = this;
    // underlying data storage must be observable
    // PROBLEM: I need these guys to be ko observables, but
    // they also need to have other stuff
    var t1 = new InputTime(timeIn);
    this.timeIn = t1.computed;
    var t2 = new InputTime(timeOut, t1.val);
    this.timeOut = t2.computed;
    this.breakLen = ko.observable(breakLen);

    this.rowTotal = ko.computed(function () {
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
    this.cellClick = function (data, event) {
      event.target.select();
    };
    this.cellBlur = function (data, event) {
      // add row if the last row has a non-empty total
      if (viewModel !== undefined && self === viewModel.getLastRow() && 
          self.rowTotal() !== "") {
        viewModel.addRow();
      }
    }
  };

  // TODO: this needs to be used to create a NEW object which
  // stores its own internal data rather than storing that in self
  // ??? what does this mean?
  /**
   * A single cell representing a time.
   */
  function InputTime(time, refTime) {
    var self = this;
    // used because we are immediately updating the cell after the user types
    // something in. with this we can cause the field to be updated because the
    // computed field is observing the _raw field. (e.g., computed.write() ->
    // _raw.write() -> computed.read() )
    this._raw = ko.observable(time);
    // we store some pre-computed values alongside the ko computed
    // observable. an alternative design would be to store those values
    // within the observable, which would be "cleaner" perhaps?
    this.val = 0;
    this.refTime = refTime;
    // this is the value bound to the input
    this.computed = ko.computed({
      read: function() { 
        // why does this get called immediately?
        return self._raw(); 
      },
      write: function(value) {
        // if they typed in the same number, then we set _raw to 
        // the same value it currently is, and then the UI doesn't update (e.g.
        // it's 3:00pm and they type '3' so it just stays as 3). To get around
        // this we set _raw temporarily to exactly what they typed in.
        self._raw(value);
        // XXX: do I need to use self over this, and do I need it at all?
        // yes, because it's on the object and yes because I'm guessing
        // this computed method runs long after "this" has changed. OTOH, 
        // I could set owner:this to use 'this' instead.
        var t1a = util.parseTime(value, self.refTime);
        if (t1a === undefined) {
          self._raw("");
        } else {
          // update the value FIRST, then the raw, to trigger a total update
          self.val = t1a[0];
          self._raw(t1a[1]);
        }
      } 
    });
    this.computed(time);
    // XXX: why does this break things? I thought this would be the
    // default beahvior
    //return this;
  }
    
  var viewModel = new TimeSheetModel();
  // better to initialize self like this?
  viewModel.init();
  
  ko.applyBindings(viewModel);

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
  function enterAdvancesField() {
    $("input").bind('keypress', function (event) {
      if (event.keyCode === 13) {
        var $set = $('input'),
          $next = $set.eq($set.index(this) + 1);
        $next.focus();
      }
    });
  }

  return {
    parseTime: util.parseTime,
    addTimes: util.addTimes
  };
});
