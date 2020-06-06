'use strict';

class Shape {
    constructor() {
        this.oid = 0;
        this.name = '';
        this.shapeType = 0;
    }

    static getModelDescriptor(apatite) {
        var table = apatite.newTable('SHAPE');
        var modelDescriptor = apatite.newModelDescriptor(Shape, table);

        var column = table.addNewColumn('OID', apatite.dialect.newIntegerType(10));
        column.bePrimaryKey();
        modelDescriptor.newSimpleMapping('oid', column);

        column = table.addNewColumn('NAME', apatite.dialect.newVarCharType(100));
        modelDescriptor.newSimpleMapping('name', column);

        column = table.addNewColumn('SHAPETYPE', apatite.dialect.newIntegerType(1));
        modelDescriptor.newSimpleMapping('shapeType', column);

        return modelDescriptor;
    }
}


module.exports = Shape;