'use strict';

var ApatiteSQLBuilder = require('./apatite-sql-builder.js');
var ApatiteSelectSQLStatement = require('../database-statement/apatite-select-sql-statement.js');

class ApatiteSelectSQLBuilder extends ApatiteSQLBuilder {
    constructor(query) {
        super(query.session);
        this.query = query;
        this.tableAliasCount = 0;
        this.joinAttrAliasNames = {};
        this.tableAliasNames = {};
        this.leftOuterJoinNames = {};
        this.normalJoinsExist = false;
        this.joinsExist = false;
        this.mainTableIdentifier = '.';
        this.parentSQLBuilder = null;
    }

    getRootSQLBuilder() {
        if (this.parentSQLBuilder)
            return this.parentSQLBuilder;
        else
            return this;
    }

    getTableAliasCount() {
        if (this.parentSQLBuilder)
            return this.parentSQLBuilder.getTableAliasCount();
        else
            return this.tableAliasCount;
    }
    incrementTableAliasCount() {
        if (this.parentSQLBuilder)
            this.parentSQLBuilder.incrementTableAliasCount();
        else
            this.tableAliasCount += 1;
    }

    getOrCreateTableAliasName(attributeName) {
        var aliasIdentifier = this.mainTableIdentifier;
        if (attributeName) {
            aliasIdentifier = attributeName;
        }

        if (this.joinAttrAliasNames[aliasIdentifier])
            return this.joinAttrAliasNames[aliasIdentifier];

        this.incrementTableAliasCount();
        var aliasName = 'T' + this.getTableAliasCount();
        this.joinAttrAliasNames[aliasIdentifier] = aliasName;
        if (!this.joinsExist)
            this.joinsExist = Object.keys(this.joinAttrAliasNames).length > 1;
        return aliasName;
    }

    getSQLStatementClass() {
        return ApatiteSelectSQLStatement;
    }

    buildSQLStatement() {
        this.query.addTypeFilterQueryExpressions();
        this.query.expandOneToOneExpressions();

        //Create alias for the main table always so the main table is T1
        this.getOrCreateTableAliasName();

        var columnsStr = this.query.buildColumnNamesToFetch(this).join(', ');
        var whereStr = this.buildWhereSQLString();
        var orderByStr = this.buildOrderBySQLString();

        //The following two calls must be after the above is executed becuase table aliases are built in the calls above
        var joinStr = this.buildJoinsSQLString();
        var tableNamesStr = this.buildTableNamesSQLString();

        var sqlStr = 'SELECT ' + columnsStr + ' FROM ' + tableNamesStr + joinStr;

        if (whereStr.length)
            if (this.normalJoinsExist)
                sqlStr += ' AND';
            else
                sqlStr += ' WHERE';

        sqlStr += whereStr + orderByStr;
        var statementClass = this.getSQLStatementClass();
        return new statementClass(null, sqlStr, this.bindVariables);
    }

    buildJoinsSQLString() {

        var sqlStr = '';
        if (!this.joinsExist)
            return sqlStr;

        var definedAliases = {};
        for (var eachJoinAttrName in this.joinAttrAliasNames) {
            if (eachJoinAttrName !== this.mainTableIdentifier) {
                definedAliases[eachJoinAttrName] = this.joinAttrAliasNames[eachJoinAttrName];
            }
        }
        var leftOuterJoinStr = '';
        var normalJoinStr = '';
        var self = this;
        var fromDescriptor, fromTableAliasName, mapping, fromColumns, toColumns, joinArr, toTableAliasName, joinAttrName;
        var definedJoins = {};
        for (var eachJoinAttrName in definedAliases) {
            fromDescriptor = self.query.getModelDescriptor();
            fromTableAliasName = self.getOrCreateTableAliasName();
            joinAttrName = '';
            joinArr = eachJoinAttrName.split('.');
            joinArr.forEach(function (eachAttrName) {
                mapping = fromDescriptor.getMappingForAttribute(eachAttrName);
                var isLeftOuterJoin = mapping.isLeftOuterJoin;
                fromColumns = mapping.columns;
                toColumns = mapping.toColumns;
                joinAttrName += (joinAttrName.length ? '.' : '') + eachAttrName;
                toTableAliasName = self.getOrCreateTableAliasName(joinAttrName);

                fromDescriptor = fromDescriptor.getModelDescriptor(mapping);
                var toTableName = fromDescriptor.table.tableName;
                if (!definedJoins[joinAttrName]) {
                    var joinStr = '';
                    for (var i = 0; i < fromColumns.length; i++) {
                        joinStr += fromTableAliasName + '.' + fromColumns[i].columnName + ' = ' + toTableAliasName + '.' + toColumns[i].columnName;
                    }
                    if (isLeftOuterJoin) {
                        leftOuterJoinStr += ' LEFT OUTER JOIN '
                        leftOuterJoinStr += toTableName
                        leftOuterJoinStr += ' '
                        leftOuterJoinStr += toTableAliasName
                        leftOuterJoinStr += ' ON '
                        leftOuterJoinStr += joinStr
                        self.leftOuterJoinNames[joinAttrName] = true;
                    } else {
                        if (normalJoinStr.length !== 0)
                            normalJoinStr += ' AND ';
                        normalJoinStr += joinStr;
                    }

                    definedJoins[joinAttrName] = true;
                }

                if (!self.tableAliasNames[joinAttrName])
                    self.tableAliasNames[joinAttrName] = [toTableName, toTableAliasName];

                fromTableAliasName = toTableAliasName;
            });
        }

        if (leftOuterJoinStr.length !== 0)
            sqlStr += leftOuterJoinStr
        
        if (normalJoinStr.length !== 0) {
            this.normalJoinsExist = true;
            sqlStr += ' WHERE ';
            sqlStr += normalJoinStr
        }

        return sqlStr;
    }

    buildTableNamesSQLString() {
        var tableAliasName = this.getOrCreateTableAliasName();
        var descriptor = this.query.getModelDescriptor();
        var definedTableAliases = [];
        definedTableAliases.push(descriptor.table.tableName + ' ' + tableAliasName);
        for (var eachJoinAttrName in this.tableAliasNames) {
            if (!this.leftOuterJoinNames[eachJoinAttrName]) {
                var aliasInfo = this.tableAliasNames[eachJoinAttrName]
                definedTableAliases.push(aliasInfo[0] + ' ' + aliasInfo[1]);
            }
        }

        return definedTableAliases.join(', ');
    }

    buildWhereSQLString() {
        var sqlStr = '';

        if (!this.query.whereExpressions.length)
            return sqlStr;

        var descriptor = this.query.getModelDescriptor();

        var self = this;
        this.query.whereExpressions.forEach(function (eachWhereExpr) {
            var sqlExpr = eachWhereExpr.buildExpressionForSQL(self, descriptor);
            sqlStr += ((sqlExpr.length && (sqlExpr[0] === ' ')) ? sqlExpr : ' ' + sqlExpr);
        });

        return sqlStr;
    }

    buildOrderBySQLString() {
        var sqlStr = '';

        if (!this.query.orderByExpressions.length)
            return sqlStr;

        var descriptor = this.query.getModelDescriptor();

        var self = this;
        var sqlExprs = [];
        this.query.orderByExpressions.forEach(function (eachOrderByExpr) {
            var sqlExpr = eachOrderByExpr.buildExpressionForSQL(self, descriptor);
            sqlExprs.push(sqlExpr);
            
        });

        return ' ORDER BY ' + sqlExprs.join(', ');
    }
}

module.exports = ApatiteSelectSQLBuilder;