'use strict';

var Shape = require('./shape.js');

class Circle extends Shape {
    constructor() {
        super();
        this.shapeType = 1;
    }

    static getModelDescriptor(apatite) {
        var modelDescriptor = apatite.newModelDescriptor(Circle, apatite.getTable('SHAPE'));
        modelDescriptor.inheritFrom(apatite.getModelDescriptor(Shape), apatite.newTypeFilterQuery().attr('shapeType').eq(1));

        return modelDescriptor;
    }
}


module.exports = Circle;