'use strict';

class ApatiteSQLBuilder {
    constructor(session) {
        this.session = session;
        this.bindVariableCount = 0;
        this.bindVariables = [];
    }

    getNextBindVariableId() {
        this.bindVariableCount++;
        return this.bindVariableCount;
    }

    newBindVariable(column) {
        var bindVar = this.session.apatite.dialect.newBindVariable(column, this);
        this.bindVariables.push(bindVar);
        return bindVar;
    }
}

module.exports = ApatiteSQLBuilder;