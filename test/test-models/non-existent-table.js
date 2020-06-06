'use strict';

class NonExistentTable {
    constructor() {
        this.oid = 0;
        this.name = '';
        this.employees = [];
        this.postSaveCalled = false;
    }

    apatitePostSave() {
        this.postSaveCalled = true;
    }

    static getModelDescriptor(apatite) {
        var table = apatite.newTable('NONEXISTENT');
        var modelDescriptor = apatite.newModelDescriptor(NonExistentTable, table);

        var column = table.addNewColumn('OID', apatite.dialect.newSerialType());
        column.bePrimaryKey();
        modelDescriptor.newSimpleMapping('oid', column);

        return modelDescriptor;
    }
}


module.exports = NonExistentTable;