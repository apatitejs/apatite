'use strict';

function ApatiteMappingError(message, extra) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.extra = extra;
};

ApatiteMappingError.prototype = Object.create(Error.prototype);

module.exports = ApatiteMappingError;