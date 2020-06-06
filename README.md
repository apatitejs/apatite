# Apatite

Object persistence framework for Node.js. ORM framework supports: MySQL, Oracle, Postgres, SQL Server, Sqlite.

[![npm](https://img.shields.io/npm/v/apatite.svg)](https://npmjs.org/package/apatite)
[![Windows Build](https://img.shields.io/appveyor/ci/apatitejs/apatite/master.svg?label=windows)](https://ci.appveyor.com/project/apatitejs/apatite)
[![Coverage Status](https://coveralls.io/repos/github/apatitejs/apatite/badge.svg?branch=master)](https://coveralls.io/github/apatitejs/apatite?branch=master)

## Features

  * Based on object oriented principles.
  * Zero dependencies.
  * Transaction based.
  * Generate (or execute) SQL scripts to create tables/columns for models/attributes.
  * Apart from standard mappings, supports inheritence mapping too.
  * Optional objects session cache management.

## Prerequisites

  * Node version >=12.13.1.
  * [oracledb](https://github.com/oracle/node-oracledb) if you plan to use Oracle: $ npm install oracledb@4.1.0
  * [pg](https://github.com/brianc/node-postgres) if you plan to use Postgres: $ npm install pg@6.1.5
  * [mysql](https://github.com/mysqljs/mysql) if you plan to use Mysql: $ npm install mysql@2.17.1
  * [tedious](https://github.com/tediousjs/tedious) if you plan to use Microsoft SQL Server: $ npm install tedious@2.0.0, optionally for connection pool: [tedious-connection-pool](https://github.com/tediousjs/tedious-connection-pool) : $ npm install tedious-connection-pool@1.0.5
  * [sqlite3](https://github.com/mapbox/node-sqlite3) if you plan to use Sqlite: $ npm install sqlite3@3.1.8

## Installation

```bash
C:\my-project> npm install apatite
```

## Quick Start

* Install the prerequisites.

* Create your class and define a static method getModelDescriptor which takes apatite as an argument.

```js
class Department {
	constructor() {
		this.oid = 0;
		this.name = '';
	}

	printName() {
		console.log(this.name);
	}

	static getModelDescriptor(apatite) {
		var table = apatite.newTable('DEPT');
		var modelDescriptor = apatite.newModelDescriptor(this, table);

		var column = table.addNewColumn('OID', apatite.dialect.newSerialType());
		column.bePrimaryKey();
		modelDescriptor.newSimpleMapping('oid', column);

		column = table.addNewColumn('NAME', apatite.dialect.newVarCharType(100));
		modelDescriptor.newSimpleMapping('name', column);

		return modelDescriptor;
	}
}
```
You could also create descriptor from a simple object:

```js
static getModelDescriptor(apatite) {
	var object = {
		table: 'DEPT',
		model: this,
		mappings: [
			{attr: 'oid', col: 'OID', pk: true, type: 'serial'},
			{attr: 'name', col: 'NAME', type: 'varchar', length: 100}
		]
	}
	return apatite.newDescriptorFromObject(object);
}
```

* Register your models.

```js
// Oracle
var connOptions = { userName: 'apatite', password: 'apatite', connectionInfo: 'localhost/apatite' };
var apatite = require('apatite').forOracle(connOptions);
```

```js
// Postgres
var connOptions = { userName: 'apatite', password: 'apatite', connectionInfo: 'localhost/apatite' };
var apatite = require('apatite').forPostgres(connOptions);
```

```js
// Mysql
var connOptions = { userName: 'apatite', password: 'apatite', connectionInfo: 'localhost/apatite' };
var apatite = require('apatite').forMysql(connOptions);
```

```js
// Mssql
var connOptions = { userName: 'apatite', password: 'apatite', connectionInfo: 'localhost/apatite' };
var apatite = require('apatite').forMssql(connOptions);
```

```js
// Sqlite
var connOptions = { connectionInfo: ':memory:' };
var apatite = require('apatite').forSqlite(connOptions);
```

```js
apatite.registerModel(Department);
```

* Create session and start querying your objects.

```js
// Creates a new session and database connection
apatite.newSession(function (err, session) {
	if (err) {
		console.error(err.message);
		return;
	}
	var query = session.newQuery(Department);
	query.execute(function(err, departments) {
		if (err) {
			console.error(err.message);
			return;
		}
		console.log(JSON.stringify(departments));
		if (departments.length)
			departments[0].printName();
		endSession(session);
	});
});

//closes the database connection
function endSession(session) {
	session.end(function(err) {
		if (err)
			console.error(err.message);
	})
}
```

```js
// Using promise to execute queries
// Creates a new session and database connection
apatite.newSession(function (err, session) {
	if (err) {
		console.error(err.message);
		return;
	}
	var query = session.newQuery(Department);
	var promise = query.execute();
	promise.then(function(departments) {
		console.log(JSON.stringify(departments));
		if (departments.length)
			departments[0].printName();
		endSession(session);
	}, function(err) {
		console.error(err.message);
		endSession(session);
	});
});

//closes the database connection
function endSession(session) {
	session.end(function(err) {
		if (err)
			console.error(err.message);
	})
}
```

```js
//query results from cursor stream
apatite.newSession(function (err, session) {
	var query = session.newQuery(Department)
	query.returnCursorStream = true

	query.execute(function (err, cursorStream) {
		if (err) {
			console.log(err)
			return endSession(session)
		}

		cursorStream.on('error', function(cursorStreamErr) {
			console.log(cursorStreamErr)
			endSession(session)
		})
		cursorStream.on('result', function(department) {
			console.log(JSON.stringify(department))
		})
		cursorStream.on('end', function() {
			endSession(session)
		})
	})
})

function endSession(session) {
	session.end(function (endConnErr) {
		if (endConnErr)
			return console.log(endConnErr)
		console.log('Connection ended.')
	})
}
```

* Do changes to your objects and save.

```js
...
	// Create new department
	var department = new Department();
	department.name = 'Sales';
	// Register it to session
	var changesToDo = function (changesDone) {
		session.registerNew(department);
		changesDone(); // must be called when you are done with all changes
	}

	session.doChangesAndSave(changesToDo, function (saveErr) {
		if (saveErr)
			console.error(saveErr.message);
	});
...
```

```js
...
	// Change an existing department
	var query = session.newQuery(Department);
	query.attr('name').eq('Sales');
	query.execute(function(executeErr, departments) {
		if (executeErr) {
			return console.error(executeErr);
		}
		var changesToDo = function (changesDone) {
			departments[0].name = 'Pre-Sales';
			changesDone(); // must be called when you are done with all changes
		}
		session.doChangesAndSave(changesToDo, function (saveErr) {
			if (saveErr)
				console.error(saveErr.message);
		});
	});
...
```

```js
...
	// Delete an existing department
	var changesToDo = function (changesDone) {
		var query = session.newQuery(Department);
		query.attr('name').eq('Pre-Sales');
		query.execute(function(executeErr, departments) {
			if (executeErr) {
				changesDone(executeErr);
				return;
			}
			session.registerDelete(departments[0]);
			changesDone(); // must be called when you are done with all changes
		});
	}

	session.doChangesAndSave(changesToDo, function (saveErr) {
		if (saveErr)
			console.error(saveErr.message);
	});
...
```

## Contributions

Welcome.

## Links

  - [Documentation](https://github.com/apatitejs/doc/blob/master/doc.md)
  - [Public API](https://github.com/apatitejs/public-api/blob/master/public-api.md)
  - [Simple Example](https://github.com/apatitejs/apatite-simple-example)

## Tests

Install all supported databases and then install dependencies:

```bash
C:\my-project> npm install
```

Run the tests:

```bash
C:\my-project> npm test
```


## License

  [MIT](LICENCE)