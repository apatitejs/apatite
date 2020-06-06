'use strict';

class Employee {
    constructor() {
        this.oid = 0;
        this.name = '';
        this.department = null;
    }

    static getModelDescriptor(apatite) {
        var table = apatite.newTable('EMP');
        var modelDescriptor = apatite.newModelDescriptor(Employee, table);

        var column = table.addNewColumn('OID', apatite.dialect.newSerialType());
        column.bePrimaryKey();
        modelDescriptor.newSimpleMapping('oid', column);

        column = table.addNewColumn('NAME', apatite.dialect.newVarCharType(100));
        modelDescriptor.newSimpleMapping('name', column);

        var deptTable = apatite.newTable('DEPT');
        var deptOIDColumn = deptTable.addNewColumn('OID', apatite.dialect.newSerialType());
        deptOIDColumn.bePrimaryKey();

        column = table.addNewColumn('DEPTOID', apatite.dialect.newIntegerType(10));
        modelDescriptor.newOneToOneMapping('department', 'Department', [column], [deptOIDColumn]);


        return modelDescriptor;
    }
}

module.exports = Employee;