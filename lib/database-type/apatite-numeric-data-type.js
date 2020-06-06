'use strict';

var ApatiteDataType = require('./apatite-data-type.js');

class ApatiteNumericDataType extends ApatiteDataType {
    constructor(length) {
        super(length);
        this.setDialectDataType('NUMERIC')
    }
}

module.exports = ApatiteNumericDataType;