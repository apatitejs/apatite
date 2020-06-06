'use strict';

var ApatiteObjectChangedAttribute = require('./apatite-object-changed-attribute.js');

class ApatiteObjectChangeSet {
    constructor(object) {
        this.object = object;
        this.changedAttrs = {};
    }

    registerAttrValueChange(attrName, oldValue, isInstantiated) {
        if (this.changedAttrs[attrName])
            return;

        var changedAttr = new ApatiteObjectChangedAttribute(attrName, oldValue, isInstantiated);
        this.changedAttrs[attrName] = changedAttr;
    }

    getChangedAttrNames() {
        return Object.keys(this.changedAttrs);
    }

    rollback(session) {
        var descriptor = session.apatite.getModelDescriptor(this.object.constructor.name);
        for (var eachAttrName in this.changedAttrs) {
            this.changedAttrs[eachAttrName].rollback(this.object, session, descriptor);
        }
    }
}

module.exports = ApatiteObjectChangeSet;