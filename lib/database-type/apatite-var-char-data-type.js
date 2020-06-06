'use strict';

var ApatiteStringDataType = require('./apatite-string-data-type.js');

class ApatiteVarCharDataType extends ApatiteStringDataType {
    constructor(length) {
        super(length);
        this.setDialectDataType('VARCHAR')
    }
}

module.exports = ApatiteVarCharDataType;