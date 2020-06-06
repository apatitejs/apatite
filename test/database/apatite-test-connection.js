'use strict';

var ApatiteConnection = require('../../lib/database/apatite-connection.js');
var ApatiteError = require('../../lib/error/apatite-error');
var ApatiteTestQueryStream = require('./apatite-test-query-stream.js');

class ApatiteTestConnection extends ApatiteConnection {
    constructor(dialect) {
        super(dialect);
        this.sqlCount = 0;
        this.failBeginTrans = false;
        this.failCommitTrans = false;
        this.failRollbackTrans = false;
        this.failCursor = false;
        this.failSql = false;
        this.isDDLSqlPromiseTest = false;
        this.productRecords = [{ 'T1.OID': 1, 'T1.NAME': 'Shampoo', 'T1.QUANTITY': 100 }];
        this.petRecords = [{ 'T1.OID': 1, 'T1.NAME': 'Dog' }, { 'T1.OID': 2, 'T1.NAME': 'Cat' }, { 'T1.OID': 3, 'T1.NAME': 'Mouse' }, { 'T1.OID': 4, 'T1.NAME': 'Donkey' }];
        this.petRecords2 = [{ 'T1.OID': 1, 'T1.NAME': 'Dog', 'T1.AGE': 11 }, { 'T1.OID': 2, 'T1.NAME': 'Cat', 'T1.AGE': 5 }, { 'T1.OID': 3, 'T1.NAME': 'Mouse', 'T1.AGE': 3 }, { 'T1.OID': 4, 'T1.NAME': 'Donkey', 'T1.AGE': 7 }];
        this.personRecords = [{ 'T1.OID': 1, 'T1.NAME': 'Madhu', 'T1.PETOID': null }, { 'T1.OID': 2, 'T1.NAME': 'Sam', 'T1.PETOID': 1 }, { 'T1.OID': 3, 'T1.NAME': 'Peter', 'T1.PETOID': 2 }];
        this.shapeRecords = [
            { 'T1.OID': 1, 'T1.NAME': 'Circle', 'T1.SHAPETYPE': 1, 'T1.TESTATTR': 'ci', 'T1.NOOFVERTICES': null },
            { 'T1.OID': 2, 'T1.NAME': 'Square', 'T1.SHAPETYPE': 2, 'T1.TESTATTR': 'sq', 'T1.NOOFVERTICES': 4 },
            { 'T1.OID': 3, 'T1.NAME': 'Rectangle', 'T1.SHAPETYPE': 2, 'T1.TESTATTR': 're', 'T1.NOOFVERTICES': 4 },
            { 'T1.OID': 4, 'T1.NAME': 'SemiCircle', 'T1.SHAPETYPE': 3, 'T1.TESTATTR': 'se', 'T1.NOOFVERTICES': null }
        ];
        this.departmentRecords = [
            { 'T1.OID': 1, 'T1.NAME': 'Development' },
            { 'T1.OID': 2, 'T1.NAME': 'HR' },
            { 'T1.OID': 3, 'T1.NAME': 'Sales' }
        ];
        this.employeeRecords = [
            { 'T1.OID': 1, 'T1.NAME': 'Madhu', 'T1.DEPTOID': 1 },
            { 'T1.OID': 2, 'T1.NAME': 'Peter', 'T1.DEPTOID': 2 },
            { 'T1.OID': 3, 'T1.NAME': 'Sam', 'T1.DEPTOID': 3 },
            { 'T1.OID': 4, 'T1.NAME': 'Scot', 'T1.DEPTOID': 1 }
        ];
        this.mixedAttrsList = [
            { 'T1.NAME': 'Madhu', 'T2.NAME': 'First Floor', 'T3.NAME': 'First Floor' },
            { 'T1.NAME': 'Peter', 'T2.NAME': 'Second Floor', 'T3.NAME': 'First Floor' },
            { 'T1.NAME': 'Sam', 'T2.NAME': 'Third Floor', 'T3.NAME': 'Third Floor' },
            { 'T1.NAME': 'Scot', 'T2.NAME': 'Second Floor', 'T3.NAME': 'Third Floor' }
        ];
        this.mixedAttrsList2 = [
            { 'T1.NAME': 'Madhu', 'T2.NAME': null },
            { 'T1.NAME': 'Sam', 'T2.NAME': 'Dog' },
            { 'T1.NAME': 'Peter', 'T2.NAME': 'Cat' }
        ];
        this.bookRecords = [
            { 'T1.OID': 1, 'T1.NAME': 'Learn Javascript in 30 Days', 'T1.NUMBEROFPAGES': 150 },
            { 'T1.OID': 2, 'T1.NAME': 'Apatite', 'T1.NUMBEROFPAGES': 60 },
            { 'T1.OID': 3, 'T1.NAME': 'Learning Node.js', 'T1.NUMBEROFPAGES': 120 }
        ];
        this.booksSumResult = this.bookRecords.reduce(function(prev, curr) { return {'T1.NUMBEROFPAGES': prev['T1.NUMBEROFPAGES'] + curr['T1.NUMBEROFPAGES']}});
        this.maxBookPagesResult = Math.max.apply(Math,this.bookRecords.map(function(row){return row['T1.NUMBEROFPAGES'];}));
        this.minBookPagesResult = Math.min.apply(Math,this.bookRecords.map(function(row){return row['T1.NUMBEROFPAGES'];}));
        this.sqlResults = {
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM DEPT T1 WHERE T1.OID IN (?,?,?) AND EXISTS ( SELECT T2.OID AS "T2.OID", T2.NAME AS "T2.NAME", T2.DEPTOID AS "T2.DEPTOID" FROM EMP T2 WHERE T2.DEPTOID = T1.OID )123': this.departmentRecords,
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM PET T1 WHERE NOT EXISTS ( SELECT T2.OID AS "T2.OID", T2.NAME AS "T2.NAME", T2.PETOID AS "T2.PETOID" FROM PERSON T2 WHERE T2.PETOID = T1.OID )': [this.petRecords[2], this.petRecords[3]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM PET T1 WHERE EXISTS ( SELECT T2.OID AS "T2.OID", T2.NAME AS "T2.NAME", T2.PETOID AS "T2.PETOID" FROM PERSON T2 WHERE T2.PETOID = T1.OID )': this.petRecords,
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM DEPT T1 WHERE EXISTS ( SELECT T2.OID AS "T2.OID", T2.NAME AS "T2.NAME", T2.DEPTOID AS "T2.DEPTOID" FROM EMP T2 WHERE T2.DEPTOID = T1.OID AND T2.NAME = ? )Madhu': [this.departmentRecords[0]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM DEPT T1 WHERE EXISTS ( SELECT T2.OID AS "T2.OID", T2.NAME AS "T2.NAME", T2.DEPTOID AS "T2.DEPTOID" FROM EMP T2 WHERE T2.DEPTOID = T1.OID )': this.departmentRecords,
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE T1.OID = ? OR T1.OID = ?13': [this.bookRecords[0], this.bookRecords[2]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE T1.OID IN (?,?)13': [this.bookRecords[0], this.bookRecords[2]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE T1.NAME = ? AND T1.NUMBEROFPAGES = ? AND T1.OID = ?Apatite602': [this.bookRecords[1]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE ( T1.NAME = ? AND T1.NUMBEROFPAGES = ? ) OR ( T1.NAME = ? AND T1.NUMBEROFPAGES = ? ) OR ( T1.NAME = ? AND T1.NUMBEROFPAGES = ? )Apatite X60Learning X Node.js120Learn Javascript in 30 Days150': [this.bookRecords[0]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE ( T1.NAME = ? AND T1.NUMBEROFPAGES = ? ) OR ( T1.NAME = ? AND T1.NUMBEROFPAGES = ? ) OR ( T1.NAME = ? AND T1.NUMBEROFPAGES = ? )Apatite X60Learning Node.js120Learn Javascript X in 30 Days150': [this.bookRecords[2]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE ( T1.NAME = ? AND T1.NUMBEROFPAGES = ? ) OR ( T1.NAME = ? AND T1.NUMBEROFPAGES = ? ) OR ( T1.NAME = ? AND T1.NUMBEROFPAGES = ? )Apatite60Learning Node.js120Learn Javascript in 30 Days150': this.bookRecords,
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE ( T1.NAME = ? AND T1.NUMBEROFPAGES = ? ) OR ( T1.NAME = ? AND T1.NUMBEROFPAGES = ? )Apatite60Learning Node.js120': [this.bookRecords[1], this.bookRecords[2]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE ( T1.NAME = ? OR T1.NAME = ? ) AND ( T1.NUMBEROFPAGES = ? OR T1.NUMBEROFPAGES = ? )ApatiteLearning Node.js6070': [this.bookRecords[1]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1': this.bookRecords,
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE T1.NAME LIKE ?L%': [this.bookRecords[0], this.bookRecords[2]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE T1.NAME NOT LIKE ?L%': [this.bookRecords[1]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE T1.NUMBEROFPAGES > ?120': [this.bookRecords[0]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE T1.NUMBEROFPAGES >= ?120': [this.bookRecords[0], this.bookRecords[2]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE T1.NUMBEROFPAGES < ?120': [this.bookRecords[1]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE T1.NUMBEROFPAGES <= ?120': [this.bookRecords[1], this.bookRecords[2]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE T1.NUMBEROFPAGES <> ?120': [this.bookRecords[0], this.bookRecords[1]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE T1.NUMBEROFPAGES IN ?[120,150]': [this.bookRecords[0], this.bookRecords[2]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE T1.NAME IS NULL': [],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.NUMBEROFPAGES AS "T1.NUMBEROFPAGES" FROM BOOK T1 WHERE T1.NAME IS NOT NULL': this.bookRecords,
            'SELECT DISTINCT(T1.NUMBEROFPAGES) AS "distinctPages" FROM BOOK T1': [{distinctPages: this.bookRecords[0]['T1.NUMBEROFPAGES']}, {distinctPages: this.bookRecords[1]['T1.NUMBEROFPAGES']}, {distinctPages: this.bookRecords[2]['T1.NUMBEROFPAGES']}],
            'SELECT AVG(T1.NUMBEROFPAGES) AS "avgOfPages" FROM BOOK T1': [{avgOfPages: this.booksSumResult['T1.NUMBEROFPAGES'] / this.bookRecords.length}],
            'SELECT MIN(T1.NUMBEROFPAGES) AS "minOfPages" FROM BOOK T1': [{minOfPages: this.minBookPagesResult}],
            'SELECT MAX(T1.NUMBEROFPAGES) AS "maxOfPages" FROM BOOK T1': [{maxOfPages: this.maxBookPagesResult}],
            'SELECT SUM(T1.NUMBEROFPAGES) AS "sumOfPages" FROM BOOK T1': [{sumOfPages: this.booksSumResult['T1.NUMBEROFPAGES']}],
            'SELECT COUNT(*) AS "countOfPets" FROM PET T1': [{countOfPets: this.petRecords.length}],
            'SELECT T1.NAME AS "T1.NAME", T2.NAME AS "T2.NAME" FROM PERSON T1, PET T2 WHERE T1.PETOID = T2.OID': this.mixedAttrsList2,
            'SELECT T1.NAME AS "T1.NAME", T2.NAME AS "T2.NAME", T3.NAME AS "T3.NAME" FROM EMP T1, LOCATION T2, LOCATION T3 WHERE T1.LOCATIONOID = T2.OID AND T1.SECLOCATIONOID = T3.OID': this.mixedAttrsList,
            'SELECT T1.NAME AS "T1.NAME" FROM PET T1': this.petRecords,
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM PET T1': this.petRecords,
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.QUANTITY AS "T1.QUANTITY" FROM PRODUCT T1': this.productRecords,
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.AGE AS "T1.AGE" FROM PET T1': this.petRecords2,
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.PETOID AS "T1.PETOID" FROM PERSON T1': this.personRecords,
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.PETOID AS "T1.PETOID" FROM PERSON T1 WHERE T1.OID > ? AND ( ( T1.PETOID = ? ) )0': this.personRecords, 
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM PET T1 WHERE T1.OID = ?': [],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM PET T1 WHERE T1.OID = ?1': [this.petRecords[0]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM PET T1 WHERE T1.OID = ?2': [this.petRecords[1]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM PET T1 WHERE T1.OID = ?3': [this.petRecords[2]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.AGE AS "T1.AGE" FROM PET T1 WHERE T1.OID = ?': [],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.AGE AS "T1.AGE" FROM PET T1 WHERE T1.OID = ?1': [this.petRecords2[0]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.AGE AS "T1.AGE" FROM PET T1 WHERE T1.OID = ?2': [this.petRecords2[1]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.AGE AS "T1.AGE" FROM PET T1 WHERE T1.OID = ?3': [this.petRecords2[2]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.AGE AS "T1.AGE" FROM PET T1 WHERE T1.OID = ?4': [this.petRecords2[4]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM PET T1 WHERE T1.NAME = ?Dog': [this.petRecords[0]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM PET T1 WHERE T1.NAME = ? AND T1.OID = ?Dog1': [this.petRecords[0]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM PET T1 WHERE T1.NAME = ? OR T1.NAME = ?DogDog': [this.petRecords[0]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM PET T1 WHERE T1.NAME = ?Donkey': [this.petRecords[3]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.SHAPETYPE AS "T1.SHAPETYPE", T1.TESTATTR AS "T1.TESTATTR", T1.NOOFVERTICES AS "T1.NOOFVERTICES" FROM SHAPE T1': this.shapeRecords,
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.SHAPETYPE AS "T1.SHAPETYPE", T1.NOOFVERTICES AS "T1.NOOFVERTICES", T1.TESTATTR AS "T1.TESTATTR" FROM SHAPE T1': this.shapeRecords,
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.SHAPETYPE AS "T1.SHAPETYPE", T1.TESTATTR AS "T1.TESTATTR" FROM SHAPE T1 WHERE ( T1.SHAPETYPE = ? )1': [this.shapeRecords[0]],
            'SELECT T1.NOOFVERTICES AS "T1.NOOFVERTICES", T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.SHAPETYPE AS "T1.SHAPETYPE" FROM SHAPE T1 WHERE ( T1.SHAPETYPE = ? )2': [this.shapeRecords[1], this.shapeRecords[2]],
            'SELECT T1.TESTATTR AS "T1.TESTATTR", T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.SHAPETYPE AS "T1.SHAPETYPE" FROM SHAPE T1 WHERE ( T1.SHAPETYPE = ? )3': [this.shapeRecords[3]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM DEPT T1': this.departmentRecords,
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.DEPTOID AS "T1.DEPTOID" FROM EMP T1': this.employeeRecords,
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM DEPT T1 WHERE T1.OID = ?1': [this.departmentRecords[0]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM DEPT T1 WHERE T1.OID = ?2': [this.departmentRecords[1]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.DEPTOID AS "T1.DEPTOID" FROM EMP T1 WHERE T1.DEPTOID = ? ORDER BY T1.NAME1': [this.employeeRecords[0], this.employeeRecords[3]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.DEPTOID AS "T1.DEPTOID" FROM EMP T1 WHERE T1.DEPTOID = ? ORDER BY T1.NAME2': [this.employeeRecords[1]],
            'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.DEPTOID AS "T1.DEPTOID" FROM EMP T1 WHERE T1.OID > ? AND ( ( T1.DEPTOID = ? ) )01': [this.employeeRecords[0], this.employeeRecords[3]]
        };
    }

    basicBeginTransaction(onTransactionBegan) {
        if (this.failBeginTrans)
            onTransactionBegan(new Error('Could not begin transaction.'));
        else
            onTransactionBegan(null);
    }

    basicCommitTransaction(onTransactionCommitted) {
        if (this.failCommitTrans)
            onTransactionCommitted(new Error('Could not commit transaction.'));
        else
            onTransactionCommitted(null);
    }

    basicRollbackTransaction(onTransactionRollbacked) {
        if (this.failRollbackTrans)
            onTransactionRollbacked(new Error('Could not rollback transaction.'));
        else
            onTransactionRollbacked(null);
    }

    basicConnect(onConnected) {
        if (this.dialect.connectionOptions.userName !== 'apatite') {
            onConnected(new ApatiteError('User name invalid.'));
            return;
        }

        if (this.dialect.connectionOptions.password !== 'test')
            onConnected(new ApatiteError('Password invalid.'));
        else
            onConnected(null);
    }

    basicExecuteSQLString(sqlStr, bindVariables, onExecuted, options) {
        if (options && options.returnCursorStream) {
            var queryStream = new ApatiteTestQueryStream(this);
            onExecuted(null, queryStream);
            return;
        }
        if (this.isDDLSqlPromiseTest) {
            var self = this
            if (sqlStr === 'ALTER TABLE PET ADD (NAME VARCHAR (100))') {
                // setTimeout required for promise tests
                setTimeout(function () {
                    onExecuted(new Error('SQL execution failed.'));
                }, 5);
            }
            else {
                // setTimeout required for promise tests
                setTimeout(function () {
                    onExecuted(null, null);
                }, 5);
            }
            return;
        }

        var bindings = this.buildBindVariableValues(bindVariables);
        this.sqlCount++;
        var key = sqlStr + bindings.join('');
        var result = this.sqlResults[key];
        if (sqlStr.indexOf('SELECT') === 0) {
            if (key === 'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME", T1.DEPTOID AS "T1.DEPTOID" FROM EMP T1 WHERE T1.DEPTOID = ? ORDER BY T1.NAME3') {
                // setTimeout required for promise (one to one proxy) tests
                setTimeout(function () {
                    onExecuted(new Error('Select statement failed.'));
                }, 10);
                return;
            } else if (key === 'SELECT T1.OID AS "T1.OID", T1.NAME AS "T1.NAME" FROM DEPT T1 WHERE T1.OID = ?3') {
                // setTimeout required for promise (one to one proxy) tests
                setTimeout(function () {
                    onExecuted(new Error('Select statement failed.'));
                }, 10);
                return;
            } else if (!result)
                throw new Error('SQL not defined: ' + key);
        } else if ((sqlStr === 'UPDATE PET SET NAME = ? WHERE OID = ?') && (bindings[0] === 'DogXXXXXXXXXXXXXXX'))
            return onExecuted(new Error('Update statement failed.'));
        if (this.failCursor)
            onExecuted(null, new Error('Cursor failure.'));
        else
            onExecuted(null, result);
    }
}

module.exports = ApatiteTestConnection;