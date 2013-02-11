/*jslint browser: true*/
/*global $, jQuery, moment*/

define(["jquery", "moment"], function($) {
  'use strict';

  var HOUR_PRECISION = 2;

  // I want to define my functions top-down, but declaring them satisfies strict.
  var clearAndInit, updateTotalsOnBlur, selectAllOnClick, enterAdvancesField, clearButton, addRow, clearRow, updateTotalColumn, rowTotal, updateRow, lastRow, computeRow, updateInputIfValid, parseTime, addTimes;

  function init() {
    clearAndInit();
    updateTotalsOnBlur();
    selectAllOnClick();
    enterAdvancesField();
    clearButton();
    // add a couple extra rows in the beginning to have 3 total
    addRow();
    addRow();
  }

  /**
   * For initializing and/or clearing the table
   */
  function clearAndInit() {
    // auto-focus on the first input
    $('.day input:visible:first').first().focus();
    // XXX: does each return objects?  how can i wrap them
    $('.main-table tr.day').each(function () {
      clearRow(this);
      $(this).removeClass('error');
    });
    updateTotalColumn();
  }

  /**
   * When leaving a cell, update the totals
   */
  function updateTotalsOnBlur() {
    $("input").blur(function (event) {
      var $curRow = $(event.target).parents('tr').first(),
        rowTotal = updateRow($curRow);
      //console.log("row = " + $('.main-table tr').index($curRow));
      updateTotalColumn();
      // if the last row is filled out, add another row
      if (rowTotal !== "" && lastRow().get(0) === $curRow.get(0)) {
        addRow();
      }
    });
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
    var timeArr = parseTime($input.val(), refTime);
    if (timeArr === undefined) {
      return undefined;
    } else {
      $input.val(timeArr[1]);
    }
    return timeArr[0];
  }

  /**
   * Convert this input's value to military time with decimal
   * minute value.
   *   e.g. 2, 2pm, 2:15, 2:15pm
   * @param refTime reference time, assumed to be earlier, used for inference
   * @return undefined if not understood else an array with the time
   *   computed and a string showing how we interpreted it
   */
  function parseTime(val, refTime) {
    // doesn't parse 2p correctly so add a 'm' if we detect this
    var meridiem = /[a|p]m?$/i.test(val);
    if (/[a|p]$/i.test(val)) {
      val += "m";
    }
    // let moment.js figure out what they said
    var m = moment(val, "h:mma");
    if (!m) {
      return undefined;
    }
    // if we got 0 hours as a parsed result, but they didn't have a 12, then they
    // just entered some junk
    if (m.hours() === 0 && !/12/.test(val)) {
      return undefined;
    }
    // hours comes back in 0-23 range so it's already "military" time
    var fval = m.hours() + m.minutes() / 60.0;
    if (!fval && fval !== 0) {
      return undefined;
    }
    // if this time is earlier than our reference time, make it PM if not already
    //console.log(meridiem + "," + fval + "," + refTime);
    if (!meridiem && fval < refTime) {
      if (m.hours() < 12) {
        fval += 12;
        m.hours(m.hours() + 12);
      }
    }
    // pass back the interpreted value, how we understood it
    var interpVal = m.format("h:mma");
    return [fval, interpVal];
  }

  /**
   * Add across the totals column.
   */
  function updateTotalColumn() {
    // "get" gets the array behind the jquery object
    var arr = $('.day-total').map(function () {
      return $(this).text();
    }).get(),
    total = addTimes(arr);
    $('.week-total').text(total.toFixed(HOUR_PRECISION));
  }

  /**
   * Reduce an array of strings by summing as numbers.
   */
  function addTimes(times) {
    var total = 0;
    times.forEach(function (x) {
      // assume it's an hour total
      // ignore if blank, NaN, undefined, etc. (or 0)
      if (x) {
        total += parseFloat(x);
      }
    });
    return total;
  }

  return {
    init: init, 
    updateInputIfValid: updateInputIfValid, 
    parseTime: parseTime,
    addTimes: addTimes
  };
});
