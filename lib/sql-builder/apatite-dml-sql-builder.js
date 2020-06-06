'use strict';

var ApatiteSQLBuilder = require('./apatite-sql-builder.js');

class ApatiteDMLSQLBuilder extends ApatiteSQLBuilder {
    constructor(session, object) {
        super(session);
        this.object = object;
        this.tableName = null;
    }

    buildAttrExprsForSQL(mappings) {
        var descriptor = this.session.apatite.getModelDescriptor(this.object.constructor.name);

        var attrExprs = [];
        var self = this;
        mappings.forEach(function (eachMapping) {
            eachMapping.buildAttrExprsForSQL(self.object, descriptor).forEach(function (eachAttrExpr) {
                var column = descriptor.findOwnColumnForAttribute(eachAttrExpr.expressionValue);
                eachAttrExpr.setMappingColumn(column);
                attrExprs.push(eachAttrExpr);
            });
        });

        return attrExprs;
    }

}

module.exports = ApatiteDMLSQLBuilder;