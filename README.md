TimeCalc
========
A simple timesheet calculator for adding up hours worked in a week.  I designed this to have a small app to tinker with JavaScript and related technologies.


Features
--------



Stories
-------
x should display 5 rows with 3 columns
x should label rows: day 1, day 2, ...
x should display 3 column headers: Time In, Time Out, Break Length
x alignment in input fields should be on right side
x after each focus change, should update hours for each day after entered
x after each focus change, should compute total hours for entire week
x clicking on an item should select it
x start w focus in first field
x entering any invalid number in break field wipes it out and its value is 0
x a total negative time makes the total go red to indicate an error
x valid times must be for in and out else no total is shown for that row (and its value is 0)
x fields 1 and 2 are interpreted as times and field 3 as a duration
x should understand time formats: 9, 9p, 9pm, 9:15, 9:15pm, 9:15p
x out time less than in time should result in error; highlighting in red
x if out is less than in, infer PM unless merdiem was explicitly stated
x replace the time with the normalized time so there is no confusion on what was selected
x limit the precision on any number to 2 decimal places
x BDD spec tests with Jasmine
x should return undefined for junk not 12am
x When visiting the page, should be able to see directions: …
x When visiting the page, should be one row displayed at first
x After filling out the last valid row, another is added


Todo
----
* Should be able to click a button to clear to start over (reload?)

* Should allow checkbox to round to nearest .25

Misc
----
More cool UI interactions
Style it
Deploy to host environment (Heroku)
Github for feedback -- how to allow comments?
BDD-style acceptance testing
Try knockout.js for UI interactions


Low Priority
------------
Should allow times without punctuation


Contact
-------
Post bugs and issues on [github].  Send other comments to John Lehmann:
first last at geemail dotcom or [@jplehmann]

[@jplehmann]: www.twitter.com/jplehmann
[github]: https://github.com/jplehmann/coursera/issues
