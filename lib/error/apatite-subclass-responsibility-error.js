'use strict';

function ApatiteSubclassResponsibilityError(extra) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = 'My subclass should have overridden this method.';
    this.extra = extra;
};

ApatiteSubclassResponsibilityError.prototype = Object.create(Error.prototype);

module.exports = ApatiteSubclassResponsibilityError;