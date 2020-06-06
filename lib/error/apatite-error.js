'use strict';

function ApatiteError(message, extra) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.extra = extra;
};

ApatiteError.prototype = Object.create(Error.prototype);

module.exports = ApatiteError;