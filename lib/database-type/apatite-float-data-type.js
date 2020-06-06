'use strict';

var ApatiteNumericDataType = require('./apatite-numeric-data-type.js');

class ApatiteFloatDataType extends ApatiteNumericDataType {
    constructor() {
        super(null);
        this.setDialectDataType('FLOAT')
    }
}


module.exports = ApatiteFloatDataType;