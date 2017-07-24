'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
(function findRoot(pth) {
    var possiblePkgDotJsonPath = path.resolve(String(pth) + '/package.json');
    try {
        fs.statSync(possiblePkgDotJsonPath).isFile();
        console.log(pth);
        process.exit(0);
    }
    catch (err) {
        var subPath = path.resolve(String(pth) + '/../');
        if (subPath === pth) {
            console.error(' => Cannot find path to project root.');
            process.exit(1);
        }
        else {
            return findRoot(subPath);
        }
    }
})(process.cwd());
