define([], function() {
    
    describe("Check some false values", function() {
        
        it("Is false, false", function() {
            expect(false).toBe(false);
        });

        it("Is false not true", function() {
            expect(false).not.toBe(true);
        });

        it("Is false, falsy", function() {
            expect(false).toBeFalsy();
        });

    });

});