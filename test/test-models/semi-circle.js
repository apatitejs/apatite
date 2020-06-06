'use strict';

var Circle = require('./circle.js');

class SemiCircle extends Circle {
    constructor() {
        super();
        this.shapeType = 3;
        this.testAttr = '';
    }

    static getModelDescriptor(apatite) {
        var modelDescriptor = apatite.newModelDescriptor(SemiCircle, apatite.getTable('SHAPE'));
        modelDescriptor.inheritFrom(apatite.getModelDescriptor(Circle), apatite.newTypeFilterQuery().attr('shapeType').eq(3));

        var column = apatite.getTable('SHAPE').addNewColumn('TESTATTR', apatite.dialect.newVarCharType(2));
        modelDescriptor.newSimpleMapping('testAttr', column);

        return modelDescriptor;
    }
}


module.exports = SemiCircle;