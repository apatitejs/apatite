'use strict';

var ApatiteDataType = require('./apatite-data-type.js');
var ApatiteConfigError = require('../error/apatite-config-error');

class ApatiteStringDataType extends ApatiteDataType {
    constructor(length) {
        super(length);
    }

    validate(column) {
        super.validate(column);

        if (!this.length && !column.table.dialect.ignoreDataTypeLength)
            throw new ApatiteConfigError('Invalid length specified for column: ' + column.columnName + ' in table ' + column.table.tableName + '.');
    }
}

module.exports = ApatiteStringDataType;