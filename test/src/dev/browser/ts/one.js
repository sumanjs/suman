"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Test = suman.init(module).Test;
Test.create(function (it, context) {
    it('passes with flying colors', function (t) {
    });
    context('is good', function (b) {
        b.set('good', true);
        it('is good 1', function (t) {
            t.assert.equal(t.get('good'), true);
        });
        it('is good 2', function (t) {
            t.assert.equal(t.get('good'), true);
        });
    });
    context('is good', function (b) {
        b.set('good', true);
        it.skip('is good');
    });
    context('is good', function (b) {
        b.set('good', true);
        it.skip('is good');
        context('is good', function (b) {
            b.set('good', false);
            it('is very good', function (t) {
                t.assert.equal(t.get('good'), false);
            });
            it('is very good', function (t) {
                t.assert.equal(t.get('good'), false);
            });
        });
    });
    context('is good', function (b) {
        b.set('good', true);
        it.skip('is good');
    });
});
