'use strict';

var ApatiteIntegerDataType = require('./apatite-integer-data-type.js');

class ApatiteSerialDataType extends ApatiteIntegerDataType {
    constructor() {
        super(null);
    }

    isSerialType() {
        return true;
    }
}

module.exports = ApatiteSerialDataType;