define([], function() {
  /**
   * Convert this input's value to military time with decimal
   * minute value.
   *   e.g. 2, 2pm, 2:15, 2:15pm
   * @param refTime reference time, assumed to be earlier, used for inference
   * @return undefined if not understood else an array with the time
   *   computed and a string showing how we interpreted it
   */
  function parseTime(val, refTime) {
    if (val === undefined) {
      return undefined;
    }
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
    parseTime: parseTime,
    addTimes: addTimes
  };

});
