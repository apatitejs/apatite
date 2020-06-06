'use strict'

var ApatiteError = require('../error/apatite-error.js');
var ApatiteDDLSQLStatement = require('../database-statement/apatite-ddl-sql-statement.js');

class ApatiteSQLScriptCreator {
    constructor(apatite) {
        this.apatite = apatite
    }

    static forApatite(apatite) {
        return new ApatiteSQLScriptCreator(apatite)
    }

    createStatementsForAllModels() {
        var sqls = this.createSQLsForAllModels()
        return this.buildStatementsFromSQLs(sqls)
    }

    createStatementsForModel(modelOrModelName) {
        var descriptor = this.getDescriptor(modelOrModelName)
        var sqls = this.createSQLsForDescriptor(descriptor)
        return this.buildStatementsFromSQLs(sqls)
    }

    createStatementsForModelAttribute(modelOrModelName, attributeName) {
        var sqls = this.createSQLsForAttribute(modelOrModelName, attributeName)
        return this.buildStatementsFromSQLs(sqls)
    }

    buildStatementsFromSQLs(sqls) {
        var stmts = []
        sqls.forEach(function(eachSQLStr) {
            stmts.push(new ApatiteDDLSQLStatement(null, eachSQLStr, []))
        })
        return stmts
    }

    createScriptForAllModels() {
        var sqls = this.createSQLsForAllModels()
        return this.buildScriptFromSQLs(sqls)
    }

    createScriptForModel(modelOrModelName) {
        var descriptor = this.getDescriptor(modelOrModelName)
        var sqls = this.createSQLsForDescriptor(descriptor)
        return this.buildScriptFromSQLs(sqls)
    }

    createScriptForAttribute(modelOrModelName, attributeName) {
        var sqls = this.createSQLsForAttribute(modelOrModelName, attributeName)
        return this.buildScriptFromSQLs(sqls)
    }

    buildScriptFromSQLs(sqls) {
        var sqlsForScript = sqls
        for(var i = 0; i < sqlsForScript.length; i++) {
            var sql = sqlsForScript[i] 
            if (sql[sql.length - 1] == ';') //dialect.buildAdditionalSQLsForCreateTable(table) creates PL/SQL for which ';' is appended
                sqlsForScript[i] = sql.slice(0, sql.length - 1)
        }
        var script = sqlsForScript.join(';\r\n')
        return script + ';'
    }

    createSQLsForAllModels() {
        var self = this
        var descriptorSQLs = []
        this.apatite.getModelDescriptors().forEach(function(eachDescriptor) {
            descriptorSQLs = descriptorSQLs.concat(self.createSQLsForDescriptor(eachDescriptor))
        })
        return descriptorSQLs
    }

    createSQLsForDescriptor(descriptor) {
        var table = descriptor.table
        var dialect = this.apatite.dialect
        var sql = this.buildCreateTableSQL(table)

        sql += ' ('

        var colSqls = []
        var self = this
        table.getColumns().forEach(function(eachColumn) {
            colSqls.push(self.buildColumnDefSQL(eachColumn))
        })

        sql += colSqls.join(', ')

        sql += ')'
        var addlSqls = dialect.buildAdditionalSQLsForCreateTable(table)
        var sqls = [sql].concat(addlSqls)

        return sqls
    }

    createSQLsForAttribute(modelOrModelName, attributeName) {
        var descriptor = this.getDescriptor(modelOrModelName)
        var sql = 'ALTER TABLE ' + descriptor.table.tableName + ' ADD ('
        var colSqls = []
        var self = this
        descriptor.getMappingForAttribute(attributeName).getMappedColumns().forEach(function(eachColumn) {
            colSqls.push(self.buildColumnDefSQL(eachColumn))
        })
        sql += colSqls.join(', ')
        sql += ')'
        return [sql]
    }

    getDescriptor(modelOrModelName) {
        var descriptor = this.apatite.getModelDescriptor(modelOrModelName)
        if (!descriptor)
            throw new ApatiteError(`Descriptor for model "${this.apatite.isClass(modelOrModelName) ? modelOrModelName.name : modelOrModelName}" not found.`)
        return descriptor
    }

    buildCreateTableSQL(table) {
        return 'CREATE TABLE ' + table.tableName
    }

    buildColumnDefSQL(column) {
        var dialect = this.apatite.dialect
        var sql = column.columnName + ' '
        var dataType = column.dataType
        sql += dataType.dialectDataType
        if (!dialect.ignoreDataTypeLength && dataType.length) {
            sql += ' ('
            sql += dataType.length
            if (dataType.precision)
                sql += ', ' + dataType.precision

            sql += ')'
        }

        if (!dataType.nullAllowed)
            sql += ' NOT NULL'

        if (dataType.isSerialType())
            sql += dialect.buildColumnSerialTypeDefSQL(column)

        if (column.isPrimaryKey)
            sql += ' ' + dialect.buildColumnPKDefSQL(column)

        return sql
    }
}


module.exports = ApatiteSQLScriptCreator