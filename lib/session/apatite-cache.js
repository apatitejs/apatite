'use strict';

class ApatiteCache {
    constructor(cacheSize) {
        this.cacheSize = cacheSize;
        this.objects = [];
    }

    getObjectAtKey(cacheKey) {
        for (var i = 0; i < this.objects.length; i++)
            if (this.objects[i].cacheKey === cacheKey)
                return this.objects[i].object;

        return null;
    }

    removeObject(objectToRemove) {
        for (var i = 0; i < this.objects.length; i++) {
            var objectInCache = this.objects[i].object;
            if (objectToRemove === objectInCache) {
                this.objects.splice(i, 1);
                return;
            }
        }
    }

    putObjectAtKey(object, cacheKey) {
        if (this.objects.length === this.cacheSize)
            this.objects.shift();

        this.objects.push({
            cacheKey: cacheKey,
            object: object
        });
    }

    getAllObjects() {
        var allObjects = [];

        for (var i = 0; i < this.objects.length; i++)
            allObjects.push(this.objects[i].object);

        return allObjects;
    }
}

module.exports = ApatiteCache;