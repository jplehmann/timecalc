
$( document ).ready(function() {
  // autofocus on the first input
  $('input:visible:first').first().focus();
  // when leaving a cell, update the totals
  $("input").blur(function(event) {
    updateCurrentRow(event.target);
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
 */
function updateCurrentRow(target) {
  // get target's parent
  var $trParent = $(target).parents("tr");
  var $allInputs = $trParent.find("input");
  // get all the inputs in an array
  timeValues = [];
  $allInputs.each(function() {
      timeValues.push(this.value);
    });
  // perform arithmetic
  var total = addTimes(timeValues);
  // update total
  $trParent.find("div.day.total").text(total);
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
    if (x !== "") {
      total += parseFloat(x);
    }
  });
  return total;
}


