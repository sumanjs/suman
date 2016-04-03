 Suman was designed to improve Mocha. It uses the same pattern of nested describe blocks, as this is a good pattern
 which allows for controlling different sections of the same test suite - 
 creating separate lexical scopes as well as having different options/settings, and running different hooks in each section.
 
 Suman simplifies the way contexts are bound. The number of contexts in a Suman test suite is exactly equal to the number of describe statements.
 This is why you can't use arrow functions with describe callbacks.