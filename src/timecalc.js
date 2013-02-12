/*jslint browser: true*/
/*global $, jQuery, moment*/

define(["jquery", "knockout", "util", "moment"], function($, ko, util) {
  'use strict';

  var TimeSheetModel = function(rows) {
    var self = this;
    self.rows = ko.observableArray(rows);
    self.addRow = function() {
      self.rows.push(new TimeSheetRow("", "", ""));
    };
    self.removeRow = function(row) {
        self.row.remove(row);
    };
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
  };

  // TODO: this needs to be used to create a NEW object which
  // stores its own internal data rather than storing that in self
  function InputTime(val) {
    // TODO: dont rely on this
    var self = this;
    // TODO: how does this work exactly? we create a new object
    // and set some members on it then return a closure which
    // can refernce those privileged.  Are we leaking the original
    // object since we can't directly reference it?
    self._timeIn = ko.observable();
    self._timeInVal = 0;
    return ko.computed({
      read: function() { 
        // why does this get called immediately?
        console.log("read -> " + self._timeIn());
        return self._timeIn(); 
      },
      write: function(value) {
        console.log("writing with " + value);
        var t1a = util.parseTime(value);
        if (t1a === undefined) {
          self._timeIn("");
        } else {
          self._timeIn(t1a[1]);
          self._timeInVal = t1a[0];
        }
        console.log("  wrote with " + self._timeIn());
      } 
    });
  }

  var TimeSheetRow = function (timeIn, timeOut, breakLen) {
    var self = this;
    console.log("here");
    // underlying data storage must be observable
    this.timeIn = new InputTime(self);
    console.log("input: " + timeIn);
    // initialize
    this.timeIn(timeIn);
    this._timeOut = ko.observable();
    this.timeOut = ko.computed({
      read: function() { 
        // why does this get called immediately?
        console.log("read -> " + self._timeOut());
        return self._timeOut(); 
      },
      write: function(value) {
        console.log("writing with " + value);
        var t1a = util.parseTime(value, self._timeInVal);
        if (t1a === undefined) {
          self._timeOut("");
        } else {
          self._timeOut(t1a[1]);
        }
        console.log("  wrote with " + self._timeOut());
      } 
    });
    this.timeOut(timeOut);
    this.breakLen = ko.observable(breakLen);

    this.rowTotal = ko.computed(function () {
      console.log("rowTotal got " + self.timeIn());
      var t1a = util.parseTime(self.timeIn());
      if (t1a === undefined) {
        return "";
      }
      var t2a = util.parseTime(self.timeOut(), t1a[0]);
      if (t2a === undefined) {
        return "";
      }
      var blen = parseFloat(self.breakLen()) || 0;
      //console.log("ti: " + t1a[0] + ", to: " + t2a[0]);
      return (t2a[0] - t1a[0] - blen).toFixed(HOUR_PRECISION);
    });
  };
 
  var viewModel = new TimeSheetModel([
      new TimeSheetRow("9am", "5pm", "0.25"),
      new TimeSheetRow("9am", "5pm", "0.25"),
      new TimeSheetRow("", "", "")
  ]);

  ko.applyBindings(viewModel);

  var HOUR_PRECISION = 2;

  function init() {
    focusOnFirst();
    //clearAndInit();
    selectAllOnClick();
    //updateTotalsOnBlur();
    enterAdvancesField();
    //clearButton();
    // add a couple extra rows in the beginning to have 3 total
    //addRow();
    //addRow();
  }

  function focusOnFirst() {
    // auto-focus on the first input
    $('.day input:visible:first').first().focus();
  }

  /**
   * For initializing and/or clearing the table
   */
  function clearAndInit() {
    focusOnFirst();
    // XXX: does each return objects?  how can i wrap them
    $('.main-table tr.day').each(function () {
      clearRow(this);
      $(this).removeClass('error');
    });
    updateTotalColumn();
  }

  /**
   * Clicking on an input will select all so as to replace
   * the value by default
   */
  function selectAllOnClick() {
    $('input').click(function () {
      $(this).select();
    });
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
      clearAndInit();
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
    init: init, 
    updateInputIfValid: updateInputIfValid, 
    parseTime: util.parseTime,
    addTimes: util.addTimes
  };
});
