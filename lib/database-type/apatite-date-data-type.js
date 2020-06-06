'use strict';

var ApatiteDataType = require('./apatite-data-type.js');

class ApatiteDateDataType extends ApatiteDataType
{
    constructor() {
        super(null);
        this.setDialectDataType('DATE')
    }
}

module.exports = ApatiteDateDataType;