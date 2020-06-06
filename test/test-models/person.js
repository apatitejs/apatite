'use strict';

class Person {
    constructor() {
        this.oid = 0;
        this.name = '';
        this.pet = null;
    }

    static getModelDescriptor(apatite) {
        var table = apatite.newTable('PERSON');
        var modelDescriptor = apatite.newModelDescriptor(Person, table);

        var column = table.addNewColumn('OID', apatite.dialect.newIntegerType(10));
        column.bePrimaryKey();
        modelDescriptor.newSimpleMapping('oid', column);

        column = table.addNewColumn('NAME', apatite.dialect.newVarCharType(100));
        modelDescriptor.newSimpleMapping('name', column);

        var deptTable = apatite.getOrCreateTable('PET');
        var petOIDColumn = deptTable.getColumn('OID');

        column = table.addNewColumn('PETOID', apatite.dialect.newIntegerType(10));
        modelDescriptor.newOneToOneMapping('pet', 'Pet', [column], [petOIDColumn]);


        return modelDescriptor;
    }
}

module.exports = Person;