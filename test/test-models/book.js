'use strict';

class Book {
    constructor() {
        this.oid = 0;
        this.name = '';
        this.numberOfPages = 0;
    }

    static getModelDescriptor(apatite) {
        var table = apatite.newTable('BOOK');
        var modelDescriptor = apatite.newModelDescriptor(Book, table);

        var column = table.addNewColumn('OID', apatite.dialect.newSerialType());
        column.bePrimaryKey();
        modelDescriptor.newSimpleMapping('oid', column);

        column = table.addNewColumn('NAME', apatite.dialect.newVarCharType(100));
        modelDescriptor.newSimpleMapping('name', column);

        column = table.addNewColumn('NUMBEROFPAGES', apatite.dialect.newIntegerType(4));
        modelDescriptor.newSimpleMapping('numberOfPages', column);

        return modelDescriptor;
    }
}


module.exports = Book;