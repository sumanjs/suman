define([], function() {
   
    describe("Check some true values", function() {
        
        it("Is true, true", function() {
            expect(true).toBe(true);
        });

        it("Is true not false", function() {
            expect(true).not.toBe(false);
        });
        
        it("Is true, truthy", function() {
            expect(true).toBeTruthy();
        });

    });

});