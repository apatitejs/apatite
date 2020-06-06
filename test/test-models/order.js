'use strict';

class Order {
    constructor() {
        this.oid = 0;
        this.name = '';
        this.quantity = 0;
    }

    static getModelDescriptor(apatite) {
        var table = apatite.newTable('ORDER')
        var modelDescriptor = apatite.newModelDescriptor(Order, table)

        var column = table.addNewColumn('OID', apatite.dialect.newSerialType())
        column.bePrimaryKey()
        modelDescriptor.newSimpleMapping('oid', column)

        column = table.addNewColumn('ORDERDATE', apatite.dialect.newDateType())
        modelDescriptor.newSimpleMapping('orderdate', column)

        return modelDescriptor
    }
}


module.exports = Order;