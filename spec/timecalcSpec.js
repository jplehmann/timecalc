
define(["../src/timecalc"], function(timecalc) {

  describe("Time Parser", function() {
      it("should understand whole hours", function() {
          expect(timecalc.parseTime("9")).toEqual([9, "9:00am"]);
          expect(timecalc.parseTime("9:00")).toEqual([9, "9:00am"]);
      });
      it("should understand fractions of hours", function() {
          expect(timecalc.parseTime("9:15")).toEqual([9.25, "9:15am"]);
      });
      it("should understand simple times with meridiem", function() {
          expect(timecalc.parseTime("9am")).toEqual([9, "9:00am"]);
          expect(timecalc.parseTime("9pm")).toEqual([21, "9:00pm"]);
          expect(timecalc.parseTime("9:15p")).toEqual([21.25, "9:15pm"]);
          expect(timecalc.parseTime("9:00pm")).toEqual([21, "9:00pm"]);
      });
      it("should understand single letter meridiem", function() {
          expect(timecalc.parseTime("9p")).toEqual([21, "9:00pm"]);
      });
      it("should understand reference time", function() {
          expect(timecalc.parseTime("9", "7")).toEqual([9, "9:00am"]);
      });
      it("should infer with reference time", function() {
          expect(timecalc.parseTime("7", "9")).toEqual([19, "7:00pm"]);
      });
      it("should return undefined for junk", function() {
          expect(timecalc.parseTime("asdf")).toBeUndefined();
      });
  });

  describe("Time Input", function() {
      // is there a better way than having to create my own object
      // with a stub function?
      var mockInput = { val : function() { } }; 

      it("should be set with normalized value", function() {
          spyOn(mockInput, 'val').andReturn("8");
          expect(timecalc.updateInputIfValid(mockInput)).toEqual(8);
          expect(mockInput.val).toHaveBeenCalledWith("8:00am");
      });
      it("when given ref time should be set with normalized value", function() {
          spyOn(mockInput, 'val').andReturn("8");
          expect(timecalc.updateInputIfValid(mockInput, 9)).toEqual(20);
          expect(mockInput.val).toHaveBeenCalledWith("8:00pm");
      });
      it("when given meridiem should be set with normalized value", function() {
          spyOn(mockInput, 'val').andReturn("7p");
          expect(timecalc.updateInputIfValid(mockInput)).toEqual(19);
          expect(mockInput.val).toHaveBeenCalledWith("7:00pm");
      });
      it("when given junk should be unchanged", function() {
          spyOn(mockInput, 'val').andReturn("asdf");
          expect(timecalc.updateInputIfValid(mockInput)).toBeUndefined();
          expect(mockInput.val.calls.length).toEqual(1);
      });
  });

  describe("Sum Function", function() {
      it("should add string times", function() {
          expect(timecalc.addTimes(["1", "2.1", ""])).toEqual(3.1);
      });
  });

});
