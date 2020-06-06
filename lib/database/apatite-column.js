'use strict';

var ApatiteConfigError = require('../error/apatite-config-error');

class ApatiteColumn
{
    constructor(columnName, table, dataType) {
        this.columnName = columnName;
        this.table = table;
        this.dataType = dataType;
        this.isPrimaryKey = false;
        this.isOneToOneColumn = false;
        this.hasRelativeUpdate = false;
        table.addColumn(this);
        this.toDBConverter = function (value) {
            return value;
        }
        this.toObjectConverter = function (value) {
            return value;
        }
    }

    beRelativeUpdate() {
        this.hasRelativeUpdate = true;
    }

    /**
     * Marks the column as primary key column.
     * 
     * 
     */
    bePrimaryKey() {
        this.isPrimaryKey = true;
        this.table.addPrimaryKeyColumn(this);
    }

    /**
     * Sets the functions to convert values to/from database.
     * 
     * @param {function(objectValue)} toDBConverter A function which would be called before building the sql. This function would be passed the object attribute value.
     * @param {function(databaseValue)} toObjectConverter A function which would be called before building an object. This function would be passed the database column value.
     * 
     */
    setConverters(toDBConverter, toObjectConverter) {
        this.toDBConverter = toDBConverter;
        this.toObjectConverter = toObjectConverter;
    }

    convertValueForObject(value) {
        return this.toObjectConverter(value);
    }

    convertValueForDB(value) {
        return this.toDBConverter(value);
    }

    validate() {
        if (!this.columnName)
            throw new ApatiteConfigError('Column name invalid.');

        if (!this.dataType)
            throw new ApatiteConfigError('Column: ' + this.columnName + ' data type invalid.');

        this.dataType.validate(this);
    }
}

module.exports = ApatiteColumn;