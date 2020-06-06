'use strict';

class ApatiteDataType
{
    constructor(length) {
        this.length = length;
        this.internalDataType = null;
        this.dialectDataType = '';
        this.nullAllowed = true;
    }

    beNotNull() {
        this.nullAllowed = false;
        return this;
    }

    setDialectDataType(dialectDataType) {
        this.dialectDataType = dialectDataType; 
    }

    isSerialType() {
        return false;
    }

    validate(column) {

    }
}

module.exports = ApatiteDataType;