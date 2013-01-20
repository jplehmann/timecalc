
var PRECISION = 2;

$( document ).ready(function() {
  // autofocus on the first input
  $('input:visible:first').first().focus();
  // when leaving a cell, update the totals
  $("input").blur(function(event) {
    var $curRow = $(event.target).parents('tr');
    updateRow($curRow);
    updateTotalColumn();
  });
  // clicking on an input will select all so as to replace
  // the value by default
  $('input').click(function(){
    $(this).select();
  });
  // "enter" should go to the next input field like tab
  $("input").bind('keypress', function(event) {
    if (event.keyCode === 13) {
      var $set = $('input');
      var $next = $set.eq($set.index(this)+1);
      $next.focus();
    }
  });
});

/**
 * Recompute hours for a row.
 * @param $curRow is the 'tr'
 */
function updateRow($curRow) {
  var totalTime = computeRow($curRow);
  if (totalTime === undefined) { 
    totalTime = ""; 
  } else {
    totalTime = totalTime.toFixed(PRECISION);
  }
  $total = $curRow.find("div.day.total").text(totalTime)
  if (totalTime < 0) {
    $total.addClass('error');
  }
  else {
    $total.removeClass('error');
  }
}

/**
 * Using values in current row, compute hours worked.
 * @return undefined if not valid input.
 */
function computeRow($curRow) {
  // get A B and C, and parse
  var $inputs = $curRow.find('input');
  var timeIn = parseTime($inputs.eq(0));
  var timeOut = parseTime($inputs.eq(1), timeIn);
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
  return timeOut-timeIn-breakLen;
}

/**
 * Convert this input's value to military time with decimal
 * minute value else return undefined.
 * e.g. 2:45pm = 14.75
 * try to parse: 2, 2pm, 2:15, 2:15pm
 * @param refTime reference time, assumed to be earlier, used for inference
 */
function parseTime($input, refTime) {
  var val = $input.val();
  // doesn't parse 2p correctly so add a 'm' if we detect this
  var meridiem = val && /[a|p]m/i.test(val);
  if (val.length > 0 && 
      (val[val.length-1] === 'p' || val[val.length-1] === 'a')) {
    val += "m";
    meridiem = true;
  }
  // let moment.js figure out what they said
  var m = moment(val, "h:mma")
  if (!m) {
    return undefined;
  }
  // hours comes back in 0-23 range so it's already "military" time
  var fval = m.hours() + m.minutes()/60.0;
  if (!fval && fval !== 0) {
    return undefined;
  }
  // if this time is earlier than our reference time, make it PM if not already
  if (!meridiem && fval < refTime) {
    if (m.hours() < 12) {
      fval += 12;
      m.hours(m.hours()+12);
    }
  }
  // update the field with how we understood the value
  // TODO: pass this back to caller instead
  $input.val(m.format("h:mma"));
  return fval;
}

/**
 * Add across the totals column.
 */
function updateTotalColumn() {
  // "get" gets the array behind the jquery object
  var arr = $('div.day.total').map(function(i, el) {
    return $(el).text();
  }).get();
  var total = addTimes(arr);
  $('div.week.total').text(total.toFixed(PRECISION));
};

/**
 * Reduce an array of strings by summing as numbers.
 */
function addTimes(times) {
  var total = 0;
  times.forEach(function(x) {
    // assume it's an hour total
    // ignore if blank, NaN, undefined, etc. (or 0)
    if (x) {
      total += parseFloat(x);
    }
  });
  return total;
}


