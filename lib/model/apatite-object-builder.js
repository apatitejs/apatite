'use strict';

class ApatiteObjectBuilder {
    constructor(session, tableRow, query) {
        this.session = session;
        this.tableRow = tableRow;
        this.query = query;
        this.descriptor = null;
        if (query) {
            this.descriptor = this.query.getModelDescriptor().findDescriptorToCreateObject(this);
        }
    }

    setDescriptor(descriptor) {
        this.descriptor = descriptor;
    }

    buildObject() {
        var cacheKey = this.descriptor.buildCacheKeyFromBuilder(this);
        var object = this.session.findObjectInCache(this.descriptor.model.name, cacheKey);
        if (object !== null) {
            if (this.query.matchesObject(object))
                return object;
            else
                return null;
        }

        object = new this.descriptor.model(this);

        return this.initNewObject(object, cacheKey);
    }

    shouldInitValuesFromObject() {
        return this.query === null;
    }

    initNewObject(object, cacheKeyDef) {
        var cacheKey = cacheKeyDef;
        if (this.shouldInitValuesFromObject())
            cacheKey = this.descriptor.buildCacheKeyFromObject(object);

        var self = this;
        var trackingChanges = this.session.trackingChanges;
        this.session.trackingChanges = false;
        this.descriptor.getMappings().forEach(function (eachMapping) {
            eachMapping.definePropertyInObject(object, self);
        });
        if (trackingChanges)
            this.session.trackingChanges = true;

        if (typeof object.apatitePostLoad === 'function') {
            object.apatitePostLoad()
        }
        this.session.putObjectInCache(this.descriptor.model.name, cacheKey, object);

        return object;
    }
}

module.exports = ApatiteObjectBuilder;