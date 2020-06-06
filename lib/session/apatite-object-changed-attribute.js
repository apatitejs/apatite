'use strict';

class ApatiteObjectChangedAttribute {
    constructor(attrName, oldValue) {
        this.attrName = attrName;
        this.proxyValueFetched = false;
        this.oldValue = oldValue;
        this.isProxy = false;
        this.proxyOldValue = null;
        if (oldValue) {
            if ((oldValue.constructor.name === 'ApatiteOneToOneProxy') || (oldValue.constructor.name === 'ApatiteOneToManyProxy')) {
                this.isProxy = true;
                this.proxyValueFetched = oldValue.valueFetched;
                if (oldValue.valueFetched)
                    this.proxyOldValue = oldValue.basicGetValue();
            }
        }
    }

    rollback(object, session, descriptor) {
        if (this.isProxy) {
            if (this.proxyValueFetched)
                this.oldValue.setValue(this.proxyOldValue);
            else
                this.oldValue.reset();
        }
        object[this.attrName] = this.oldValue;
    }

}

module.exports = ApatiteObjectChangedAttribute;