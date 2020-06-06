'use strict';

var ApatiteMappingError = require('../error/apatite-mapping-error');

class ApatiteMapping {
    constructor(attributeName) {
        if (!attributeName)
            throw new ApatiteMappingError('Invalid attribute name.');
        this.attributeName = attributeName;
    }

    validate(descriptor) {

    }

    isPrimaryKeyMapping(pkColumns) {
        var isPKMapping = false;
        this.getMappedColumns().forEach(function (eachColumn) {
            if (pkColumns.indexOf(eachColumn) !== -1) {
                isPKMapping = true;
            }
        });
        return isPKMapping;
    }

    getAttrValueFromObject(object, attrName) {
        var objValue = object;
        var splitArr = attrName.split('.');
        for (var i = 0; i < splitArr.length; i++) {
            if (typeof objValue === 'undefined')
                objValue = null;

            if (objValue === null)
                break;

            objValue = objValue[splitArr[i]];

            if (objValue) {
                if ((objValue.constructor.name === 'ApatiteOneToOneProxy') || (objValue.constructor.name === 'ApatiteOneToManyProxy')) {
                    if (objValue.valueFetched) {
                        objValue = objValue.basicGetValue();
                    } else {
                        objValue = null;
                    }
                }
            }
        }
        return objValue;
    }

    buildAttrExpressions(descriptor) {
        return [];
    }

    buildAttrExprsForSQL(object, descriptor) {
        return [];
    }

    getMappedColumns() {
        return [];
    }

    isSimpleMapping() {
        return false;
    }

    isOneToOneMapping() {
        return false;
    }

    isOneToManyMapping() {
        return false;
    }

    definePropInObjectWithValue(object, value, session) {
        var attrValue = value;
        var attrName = this.attributeName;
        Object.defineProperty(object, attrName, {
            get: function () { return attrValue; },
            set: function (newValue) {
                session.onAttrValueChanged(object, attrName, attrValue);
                attrValue = newValue;
            },
            enumerable: true,
            configurable: true
        });
    }
}

module.exports = ApatiteMapping;