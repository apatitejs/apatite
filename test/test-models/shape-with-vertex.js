'use strict';

var Shape = require('./shape.js');

class ShapeWithVertex extends Shape {
    constructor() {
        super();
        this.shapeType = 2;
        this.numberOfVertices = 0;
    }

    static getModelDescriptor(apatite) {
        var modelDescriptor = apatite.newModelDescriptor(ShapeWithVertex, apatite.getTable('SHAPE'));
        modelDescriptor.inheritFrom(apatite.getModelDescriptor(Shape), apatite.newTypeFilterQuery().attr('shapeType').eq(2));

        var column = apatite.getTable('SHAPE').addNewColumn('NOOFVERTICES', apatite.dialect.newIntegerType(2));
        modelDescriptor.newSimpleMapping('numberOfVertices', column);

        return modelDescriptor;
    }
}


module.exports = ShapeWithVertex;