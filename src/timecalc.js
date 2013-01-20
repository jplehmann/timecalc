
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
  var timeIn = parseTimeToDuration($inputs.eq(0));
  var timeOut = parseTimeToDuration($inputs.eq(1));
  if (timeIn === undefined || timeOut == undefined) {
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
 * Convert this input's value to some kind of duration
 * else return undefined.
 */
function parseTimeToDuration($input) {
  val = $input.val();
  fval = parseFloat(val);
  if (!fval && fval !== 0) {
    return undefined;
  }
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
  $('div.week.total').text(total);
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


