'use strict';

var ApatiteConfigError = require('../error/apatite-config-error');
var ApatiteMappingError = require('../error/apatite-mapping-error');
var ApatiteSimpleMapping = require('../mapping/apatite-simple-mapping');
var ApatiteOneToOneMapping = require('../mapping/apatite-one-to-one-mapping');
var ApatiteOneToManyMapping = require('../mapping/apatite-one-to-many-mapping');

class ApatiteModelDescriptor {
    constructor(model, table) {
        this.model = model;
        this.table = table;
        this.mappings = {};
        this.apatite = null;
        this.superModelDescriptor = null;
        this.typeFilterQuery = null;
        this.subModelDescriptors = {};
        this.pkAttrNames = null;
        this.pkMappings = null;
        this.attrColumnCache = {};
    }

    findDescriptorToCreateObject(objectBuilder) {
        var foundDescriptor = null;
        var descriptors = this.getSubClassModelDescriptors();
        if (descriptors.length) {
            descriptors.forEach(function (eachDescriptor) {
                if (!foundDescriptor)
                    foundDescriptor = eachDescriptor.findDescriptorToCreateObject(objectBuilder);
            });
            if (foundDescriptor)
                return foundDescriptor;
        }
        if (this.typeFilterQuery) {
            if (!this.typeFilterQuery.matchesRow(objectBuilder))
                return null;
        }
        return this;
    }

    getSubClassModelDescriptors() {
        var descriptors = []
        for (var eachModelName in this.subModelDescriptors)
            descriptors.push(this.subModelDescriptors[eachModelName]);
        return descriptors;
    }

    /**
     * Defines inheritance mapping.
     * 
     * @param {ApatiteModelDescriptor} superModelDescriptor An instance of class ApatiteModelDescriptor (super class).
     * @param {ApatiteTypeFilterQuery} typeFilterQuery An instance of class ApatiteTypeFilterQuery.
     * 
     */
    inheritFrom(superModelDescriptor, typeFilterQuery) {
        if (superModelDescriptor === this)
            throw new ApatiteMappingError('Invalid inheritance mapping for model: ' + this.model.name + '. Recursive inheritance detected.');

        if (!typeFilterQuery)
            throw new ApatiteMappingError('Invalid inheritance mapping for model: ' + this.model.name + '. Type filter query is required.');

        var self = this;
        superModelDescriptor.getSuperClassDescriptors().forEach(function (eachModelDescriptor) {
            if (eachModelDescriptor === self)
                throw new ApatiteMappingError('Invalid inheritance mapping for model: ' + self.model.name + '. Recursive inheritance detected.');
        });

        this.superModelDescriptor = superModelDescriptor;
        this.typeFilterQuery = typeFilterQuery;
        typeFilterQuery.setModelName(this.model.name);
        superModelDescriptor.subModelDescriptors[this.model.name] = this;
    }

    buildCacheKeyFromBuilder(objectBuilder) {
        var cacheKey = '';
        this.getPrimaryKeyMappings().forEach(function (eachMapping) {
            cacheKey += eachMapping.buildCacheKeyFromBuilder(objectBuilder);
        });
        return cacheKey;
    }

    buildCacheKeyFromObject(object) {
        var cacheKey = '';
        var self = this;
        this.getPrimaryKeyMappings().forEach(function (eachMapping) {
            cacheKey += eachMapping.buildCacheKeyFromObject(object, self);
        });
        return cacheKey;
    }

    getPrimaryKeyAttributeNames() {
        if (this.pkAttrNames === null)
            this.buildPrimaryKeyInfos();

        return this.pkAttrNames;
    }

    buildPrimaryKeyInfos() {
        this.pkAttrNames = [];
        this.pkMappings = [];
        if (this.superModelDescriptor) {
            this.superModelDescriptor.buildPrimaryKeyInfos();
            this.pkAttrNames = this.superModelDescriptor.pkAttrNames;
            this.pkMappings = this.superModelDescriptor.pkMappings;
            return
        }
        var pkColumns = this.table.getPrimaryKeyColumns();
        var self = this;
        this.getMappings().forEach(function (eachMapping) {
            if (eachMapping.isPrimaryKeyMapping(pkColumns)) {
                self.pkAttrNames.push(eachMapping.attributeName);
                self.pkMappings.push(eachMapping);
            }
        });
    }

    getModelDescriptor(mapping) {

        if (mapping.toModelName) {
            return this.apatite.getModelDescriptor(mapping.toModelName);
        }
        else
            return this;
    }
    
    getSuperClassDescriptors() {
        var superDescriptors = [];
        if (this.superModelDescriptor) {
            superDescriptors.push(this.superModelDescriptor);
            superDescriptors = superDescriptors.concat(this.superModelDescriptor.getSuperClassDescriptors());
        }
        return superDescriptors;
    }

    getPrimaryKeyMappings() {
        if (this.pkMappings === null)
            this.buildPrimaryKeyInfos();

        return this.pkMappings;
    }

    getMappingForAttribute(attrName) {

        if (attrName.indexOf('.') !== -1) {
            var splitArr = attrName.split('.');
            var oneToOneMapping = this.getMappingForAttribute(splitArr.shift());
            return this.apatite.getModelDescriptor(oneToOneMapping.toModelName).getMappingForAttribute(splitArr.join('.'));
        }

        var mapping = this.mappings[attrName];
        if (!mapping) {
            if (this.superModelDescriptor)
                return this.superModelDescriptor.getMappingForAttribute(attrName);

            this.getSubClassMappings().forEach(function (eachMapping) {
                if (eachMapping.attributeName === attrName) {
                    mapping = eachMapping;
                    return;
                }
            });
        }

        if (!mapping)
            throw new ApatiteMappingError('Mapping for attribute: ' + attrName + ' not found in model: ' + this.model.name + '.');

        return mapping;
    }

    basicFindColumnForAttr(attrName) {
        var column = this.attrColumnCache[attrName];
        if (column)
            return column;

        if (attrName.indexOf('.') == -1) {
            var column = this.getMappingForAttribute(attrName).getMappedColumns()[0];
            this.attrColumnCache[attrName] = column;
            return column;
        }
        return null;
    }

    findLeafColumnForAttr(attrName) {
        var column = this.basicFindColumnForAttr(attrName);
        if (column)
            return column;

        var splitArr = attrName.split('.');

        var oneToOneMapping = this.getMappingForAttribute(splitArr.shift());
        var descriptor = this.getModelDescriptor(oneToOneMapping);
        return descriptor.findLeafColumnForAttr(splitArr.join('.'));
    }

    findOwnColumnForAttribute(attrName) {
        var column = this.basicFindColumnForAttr(attrName);
        if (column)
            return column;

        var splitArr = attrName.split('.');
        if (splitArr.length === 1)
            throw new ApatiteMappingError('Could not find column for attribute: ' + attrName + ' from model: ' + this.model.name + '.');

        var oneToOneMapping = this.getMappingForAttribute(splitArr.shift());
        var descriptor = this.getModelDescriptor(oneToOneMapping);
        
        for (var toColIdx = 0; toColIdx < oneToOneMapping.toColumns.length; toColIdx++) {
            if (oneToOneMapping.toColumns[toColIdx] === descriptor.findOwnColumnForAttribute(splitArr.join('.'))) {
                column = oneToOneMapping.columns[toColIdx];
                this.attrColumnCache[attrName] = column;
                return column;
            }
        }
    }

    getOwnMappings() {
        var ownMappings = [];
        for (var eachMappingName in this.mappings)
            ownMappings.push(this.mappings[eachMappingName]);

        return ownMappings;
    }

    getSubClassMappings() {
        var subMappings = [];
        for (var eachModelName in this.subModelDescriptors) {
            var subDescriptor = this.subModelDescriptors[eachModelName];
            subMappings = subMappings.concat(subDescriptor.getOwnMappings());
            subMappings = subMappings.concat(subDescriptor.getSubClassMappings());
        }

        return subMappings;
    }

    getSuperClassMappings() {
        var superMappings = [];
        if (this.superModelDescriptor) {
            superMappings = superMappings.concat(this.superModelDescriptor.getSuperClassMappings());
            this.superModelDescriptor.getOwnMappings().forEach(function (eachMapping) {
                superMappings.push(eachMapping);
            });
        }

        return superMappings;
    }

    getMappings() {
        var allMappings = this.getOwnMappings();

        allMappings = allMappings.concat(this.getSuperClassMappings(), this.getSubClassMappings());

        return allMappings;
    }

    getOwnAndSuperClasMappings() {
        var allMappings = this.getOwnMappings();

        allMappings = allMappings.concat(this.getSuperClassMappings());

        return allMappings;
    }

    /**
     * Creates a new simple mapping.
     * 
     * @param {String} attributeName A string specifying the name of the attribute.
     * @param {ApatiteColumn} column An instance of ApatiteColumn.
     * @returns {ApatiteSimpleMapping} An instance of class ApatiteSimpleMapping.
     * 
     */
    newSimpleMapping(attributeName, column) {
        this.validateMappingExistence(attributeName);

        var mapping = new ApatiteSimpleMapping(attributeName, column);
        this.mappings[attributeName] = mapping;
        return mapping;
    }

    /**
     * Creates a new one to one mapping.
     * 
     * @param {String} attributeName A string specifying the name of the attribute.
     * @param {String} toModelName A string specifying the name of the model to which one to one relation needs to be defined.
     * @param {Array} columns An array containing instances of class ApatiteColumn.
     * @param {Array} toColumns An array containing instances of class ApatiteColumn. These columns are expected to be in the model defined in the parameter toModelName.
     * @returns {ApatiteOneToOneMapping} An instance of class ApatiteOneToOneMapping.
     * 
     */
    newOneToOneMapping(attributeName, toModelName, columns, toColumns) {
        this.validateMappingExistence(attributeName);

        var mapping = new ApatiteOneToOneMapping(attributeName, toModelName, columns, toColumns);
        this.mappings[attributeName] = mapping;
        return mapping;
    }

    /**
     * Creates a new one to many mapping.
     * 
     * @param {String} attributeName A string specifying the name of the attribute.
     * @param {String} toModelName A string specifying the name of the model to which one to many relation needs to be defined.
     * @param {String} toOneToOneAttrName A string specifying the name of the attribute which is defined as a one to one in the model specfied in the parameter toModelName.
     * @returns {ApatiteOneToManyMapping} An instance of class ApatiteOneToManyMapping.
     * 
     */
    newOneToManyMapping(attributeName, toModelName, toOneToOneAttrName) {
        this.validateMappingExistence(attributeName);

        var mapping = new ApatiteOneToManyMapping(attributeName, toModelName, toOneToOneAttrName);
        this.mappings[attributeName] = mapping;
        return mapping;
    }

    deleteMapping(attributeName) {
        delete this.mappings[attributeName];
    }

    createMappingsFromObject(object) {
        var self = this
        object.mappings.forEach(function (eachMappingObj) {
            self.createMappingFromObject(eachMappingObj)
        })
    }

    createMappingFromObject(object) {
        if (object.toOne) {
            var toOne = object.toOne
            var fromCols = [], toCols = [], self = this
            toOne.fromCols.forEach(function (eachFromColObj) {
                fromCols.push(self.createColumnFromObject(eachFromColObj))
            })
            toOne.toCols.forEach(function (eachToColObj) {
                var table = self.apatite.getOrCreateTable(eachToColObj.table)
                var column = table.getColumn(eachToColObj.col)
                if (!column)
                    column = self.createColumnFromObject(eachToColObj, table)
                toCols.push(column)
            })
            var mapping = this.newOneToOneMapping(object.attr, toOne.modelName, fromCols, toCols)
            if (toOne.isLeftOuterJoin === true)
                mapping.beLeftOuterJoin()
        } else if (object.toMany) {
            var toManyObj = object.toMany
            var mapping = this.newOneToManyMapping(object.attr, toManyObj.modelName, toManyObj.toOneName)
            if (toManyObj.cascadeOnDelete === true)
                mapping.cascadeOnDelete()
            if (toManyObj.orderBy) {
                var query = this.apatite.newToManyOrderQuery();
                toManyObj.orderBy.forEach(function (eachOrderByObj) {
                    var orderBy = query.orderBy(eachOrderByObj.attr);
                    if (eachOrderByObj.desc === true)
                        orderBy.desc()
                })
                mapping.setOrderByQuery(query)
            }
        } else {
            var column = this.createColumnFromObject(object)
            if (object.pk === true)
                column.bePrimaryKey()
            this.newSimpleMapping(object.attr, column)
        }
    }

    createColumnFromObject(object, targetTable) {
        var column = this.basicCreateColumnFromObject(object, targetTable);
        if (object.notNull)
            column.dataType.nullAllowed = false;

        return column;
    }

    basicCreateColumnFromObject(object, targetTable) {
        var table = targetTable ? targetTable : this.table
        var dataType = object.type ? object.type.toLowerCase() : object.type

        switch (dataType) {
            case 'serial':
                return table.addNewColumn(object.col, this.apatite.dialect.newSerialType())
            case 'varchar':
                return table.addNewColumn(object.col, this.apatite.dialect.newVarCharType(object.length))
            case 'int':
                return table.addNewColumn(object.col, this.apatite.dialect.newIntegerType(object.length))
            case 'decimal':
                return table.addNewColumn(object.col, this.apatite.dialect.newDecimalType(object.length, object.precision))
            case 'date':
                return table.addNewColumn(object.col, this.apatite.dialect.newDateType())
            default:
                throw new ApatiteMappingError('Could not read data type of column: ' + object.col + '.')
        }
    }

    validateMappingExistence(attributeName) {
        if (this.mappings[attributeName])
            throw new ApatiteMappingError('Mapping for attribute: ' + attributeName + ' already exists.');
    }

    validate() {
        this.table.validate();
        var self = this;
        this.getMappings().forEach(function (eachMapping) {
            eachMapping.validate(self);
        });
    }
}


module.exports = ApatiteModelDescriptor;