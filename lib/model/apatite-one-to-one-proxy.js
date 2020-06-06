'use strict';

const objectProp = Symbol();
var assert = require('assert');

class ApatiteOneToOneProxy {
    constructor(query) {
        this.query = query;
        this[objectProp] = this.getInitValueForObject();
        this.valueFetched = false;
    }

    getInitValueForObject() {
        return null;
    }

    basicGetValue() {
        assert.ok(this.valueFetched, 'Attempt to call basicGetValue without fetching the value first.');
        return this[objectProp];
    }

    reset() {
        this[objectProp] = this.getInitValueForObject();
        this.valueFetched = false;
    }
    
    /**
     * Fetches the real value of the proxy. If the parameter onValueFetched is defined, the function passed as parameter would be called else an instance of Promise would be returned.
     * 
     * @param {function(Error, value)} onValueFetched null/undefined or A function which would be called after the value is fetched. This function would be passed two parameters. The first an error object in case of error else null, the second the fetched value.
     * @returns undefined or an instance of Promise.
     * 
     */
    getValue(onValueFetched) {
        if (this.valueFetched) {
            if (onValueFetched)
                onValueFetched(null, this[objectProp]);
            else
                return Promise.resolve(this[objectProp]);
        } else {
            var self = this;
            if (onValueFetched)
                this.basicFetchValue(onValueFetched);
            else {
                return new Promise(function (resolve, reject) {
                    self.basicFetchValue(function (err, value) {
                        if (err)
                            reject(err);
                        else
                            resolve(value);
                    });
                });
            }
        }
        return this;
    }

    basicFetchValue(onValueFetched) {
        var self = this;
        this.query.session.execute(this.query, function (err, result) {
            if (err) {
                onValueFetched(err);
                return;
            }
            self.setValueFromQueryResult(result);

            onValueFetched(null, self[objectProp]);
        });
    }

    setValueFromQueryResult(result) {
        this.setValue(result.length ? result[0] : null);
    }

    setValue(object) {
        this[objectProp] = object;
        this.valueFetched = true;
    }

    toJSON() {
        if (this.valueFetched)
            return this[objectProp];
        else
            return `${this.constructor.name}: value not fetched yet.`;
    }
}

module.exports = ApatiteOneToOneProxy;