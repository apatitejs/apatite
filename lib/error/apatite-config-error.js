'use strict';

function ApatiteConfigError(message, extra) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.extra = extra;
};

ApatiteConfigError.prototype = Object.create(Error.prototype);

module.exports = ApatiteConfigError;