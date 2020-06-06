'use strict';

class Product {
    constructor() {
        this.oid = 0;
        this.name = '';
        this.quantity = 0;
    }

    static getModelDescriptor(apatite) {
        var table = apatite.newTable('PRODUCT')
        var modelDescriptor = apatite.newModelDescriptor(Product, table)

        var column = table.addNewColumn('OID', apatite.dialect.newSerialType())
        column.bePrimaryKey()
        modelDescriptor.newSimpleMapping('oid', column)

        column = table.addNewColumn('NAME', apatite.dialect.newVarCharType(50))
        modelDescriptor.newSimpleMapping('name', column)

        column = table.addNewColumn('QUANTITY', apatite.dialect.newDecimalType(11, 2).beNotNull())
        modelDescriptor.newSimpleMapping('quantity', column)
        column.beRelativeUpdate()

        return modelDescriptor
    }
}


module.exports = Product;