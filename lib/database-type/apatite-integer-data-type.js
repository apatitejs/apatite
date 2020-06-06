'use strict';

var ApatiteNumericDataType = require('./apatite-numeric-data-type.js');

class ApatiteIntegerDataType extends ApatiteNumericDataType {
    constructor(length) {
        super(length);
        this.setDialectDataType('INT')
    }
}

module.exports = ApatiteIntegerDataType;