

describe("Time Parser", function() {
    it("should understand whole hours", function() {
        expect(parseTime("9")).toEqual([9, "9:00am"]);
        expect(parseTime("9:00")).toEqual([9, "9:00am"]);
    });
    it("should understand fractions of hours", function() {
        expect(parseTime("9:15")).toEqual([9.25, "9:15am"]);
    });
    it("should understand simple times with meridiem", function() {
        expect(parseTime("9am")).toEqual([9, "9:00am"]);
        expect(parseTime("9pm")).toEqual([21, "9:00pm"]);
        expect(parseTime("9:15p")).toEqual([21.25, "9:15pm"]);
        expect(parseTime("9:00pm")).toEqual([21, "9:00pm"]);
    });
    it("should understand single letter meridiem", function() {
        expect(parseTime("9p")).toEqual([21, "9:00pm"]);
    });
    it("should understand reference time", function() {
        expect(parseTime("9", "7")).toEqual([9, "9:00am"]);
    });
    it("should infer with reference time", function() {
        expect(parseTime("7", "9")).toEqual([19, "7:00pm"]);
    });
});



