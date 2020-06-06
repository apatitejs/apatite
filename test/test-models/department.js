'use strict';

class Department {
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
        var table = apatite.getOrCreateTable('DEPT'); // table is created in Employee#getModelDescriptor
        var modelDescriptor = apatite.newModelDescriptor(Department, table);

        var column = table.getColumn('OID'); // column OID is created in Employee#getModelDescriptor
        modelDescriptor.newSimpleMapping('oid', column);

        column = table.addNewColumn('NAME', apatite.dialect.newVarCharType(100));
        modelDescriptor.newSimpleMapping('name', column);

        var empMapping = modelDescriptor.newOneToManyMapping('employees', 'Employee', 'department');
        var query = apatite.newToManyOrderQuery();
        query.orderBy('name');
        empMapping.setOrderByQuery(query)
        empMapping.cascadeOnDelete()

        return modelDescriptor;
    }
}


module.exports = Department;