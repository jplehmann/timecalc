/*jslint browser: true*/
/*global $, jQuery, moment*/

define(["jquery", "knockout", "util", "moment"], function($, ko, util) {
  'use strict';

  /**
   * The entire model.
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
      console.log("calling init");
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
   * A single row.
   */
  function TimeSheetRow(timeIn, timeOut, breakLen) {
    var self = this;
    console.log("here");
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
      console.log("rowTotal got " + t1.val + "," + t2.val);
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
   * A single cell.
   */
  function InputTime(time, refTime) {
    // we store some pre-computed values alongside the ko computed
    // observable. an alternative design would be to store those values
    // within the observable, which would be "cleaner" perhaps?
    var self = this;
    this._raw = ko.observable(time);
    this.val = 0;
    this.refTime = refTime;
    this.computed = ko.computed({
      read: function() { 
        // why does this get called immediately?
        console.log("read -> " + self._raw());
        return self._raw(); 
      },
      write: function(value) {
        console.log("writing with " + value);
        // XXX: do I need to use self over this, and do I need it at all?
        // yes, because it's on the object and yes because I'm guessing
        // this computed method runs long after "this" has changed.
        var t1a = util.parseTime(value, self.refTime);
        if (t1a === undefined) {
          self._raw("");
        } else {
          self._raw(t1a[1]);
          self.val = t1a[0];
        }
        console.log("  wrote with " + self._raw());
      } 
    });
    this.computed(time);
    // XXX: why does this break things? I thought this would be the
    // default beahvior
    //return this;
  }
    
  var viewModel = new TimeSheetModel();

  ko.applyBindings(viewModel);

  viewModel.init();

  var HOUR_PRECISION = 2;

  function init() {
    //focusOnFirst(true);
    //clearAndInit();
    //selectAllOnClick();
    //updateTotalsOnBlur();
    //enterAdvancesField();
    //clearButton();
    // add a couple extra rows in the beginning to have 3 total
    //addRow();
    //addRow();
  }

  function focusOnFirst(doSelect) {
    // auto-focus on the first input
    var item = $('.day input:visible:first').first().focus();
    if (doSelect === true) {
      item.select();
    }
  }

  /**
   * For initializing and/or clearing the table.
   */
  function clearAndInit() {
    // XXX: does each return objects?  how can i wrap them
    $('.main-table tr.day').each(function () {
      clearRow(this);
      $(this).removeClass('error');
    });
    updateTotalColumn();
    focusOnFirst(true);
  }

  /**
   * "Enter" should go to the next input field like tab
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

  /**
   * Setup clear button action
   */
  function clearButton() {
    $('td.clear-button').click(function (event) {
      //location.reload();
      //clearAndInit();
      viewModel.addRow();
    });
  }

  /**
   * Returns the JQuery object for last 'day' row.
   */
  function lastRow() {
    return $('.main-table tr.day').last();
  }

  /**
   * Creates a new row by cloning the last row and clearing it.
   */
  function addRow() {
    var $newRow = lastRow().clone(true).insertAfter(lastRow());
    clearRow($newRow.get());
  }

  /**
 * Takes a row object (not selector) and resets values.
   */
  function clearRow(curRow) {
    $(curRow).find('input').val("");
    $(curRow).find('.day-total').text("");
  }

  /**
   * Recompute hours for a row.
   * @param $curRow is the 'tr'
   * @return the total
   */
  function updateRow($curRow) {
  var totalTime = computeRow($curRow);
    if (totalTime === undefined) {
      totalTime = "";
    } else {
      totalTime = totalTime.toFixed(HOUR_PRECISION);
    }
    $curRow.find(".day-total").text(totalTime);
    if (totalTime < 0) {
      $curRow.addClass('error');
    } else {
      $curRow.removeClass('error');
    }
    return totalTime;
  }

  /**
   * Using values in current row, compute hours worked.
   * @return undefined if not valid input.
   */
  function computeRow($curRow) {
    // get A B and C, and parse
    var $inputs = $curRow.find('input'),
      timeIn = updateInputIfValid($inputs.eq(0)),
      timeOut = updateInputIfValid($inputs.eq(1), timeIn);
    if (timeIn === undefined || timeOut === undefined) {
      return undefined;
    }

    var breakLen = parseFloat($inputs.eq(2).val()) || 0;
    // clear out the break field if set to 0 so it's clear
    // that we didn't use it
    if (breakLen === 0) {
      $inputs.eq(2).val("");
    }
    //console.log("ti: " + timeIn + ", to: " + timeOut);
    return timeOut - timeIn - breakLen;
  }

  /**
   * Parses the time then updates the field with how it was interpreted,
   * if it was able to be parsed.
   * @return undefined if not valid input.
   */
  function updateInputIfValid($input, refTime) {
    var timeArr = util.parseTime($input.val(), refTime);
    if (timeArr === undefined) {
      return undefined;
    } else {
      $input.val(timeArr[1]);
    }
    return timeArr[0];
  }

  return {
    // XXX: this doesn't do anyting now, but I could pass the other init
    init: init, 
    updateInputIfValid: updateInputIfValid, 
    parseTime: util.parseTime,
    addTimes: util.addTimes
  };
});
