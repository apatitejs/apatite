'use strict';

var ApatiteNumericDataType = require('./apatite-numeric-data-type.js');
var ApatiteConfigError = require('../error/apatite-config-error');

class ApatiteDecimalDataType extends ApatiteNumericDataType {
    constructor(length, precision) {
        super(length);
        this.precision = precision;
        this.setDialectDataType('DECIMAL')
    }
    validate(column) {
        super.validate(column);

        if (!this.length && !column.table.dialect.ignoreDataTypeLength)
            throw new ApatiteConfigError('Invalid length specified for column: ' + column.columnName + ' in table ' + column.table.tableName + '.');

        if (!this.precision && !column.table.dialect.ignoreDataTypeLength)
            throw new ApatiteConfigError('Invalid precision specified for column: ' + column.columnName + ' in table ' + column.table.tableName + '.');
    }
}

module.exports = ApatiteDecimalDataType;