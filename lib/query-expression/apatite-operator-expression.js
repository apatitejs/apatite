'use strict';

var ApatiteExpression = require('./apatite-expression.js');

class ApatiteOperatorExpression extends ApatiteExpression {
    constructor(expressionValue, query) {
        super(expressionValue);
        this.subQuery = query;
    }

    getAttributeNames() {
        return this.subQuery.getAttributeNames();
    }

    setSubQuerySession(session) {
        if (this.subQuery)
            this.subQuery.setSession(session);
    }
}

module.exports = ApatiteOperatorExpression;