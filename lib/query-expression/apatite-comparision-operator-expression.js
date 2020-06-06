'use strict';

var ApatiteOperatorExpression = require('./apatite-operator-expression.js');

var sRE;

class ApatiteComparisionOperatorExpression extends ApatiteOperatorExpression {
    constructor(expressionValue) {
        super(expressionValue);
    }

    // from stackoverflow
    escapeChars(text) {
        if (!sRE) {
            var specials = [
                '/', '.', '*', '+', '?', '|',
                '(', ')', '[', ']', '{', '}', '\\'
            ];
            sRE = new RegExp(
                '(\\' + specials.join('|\\') + ')', 'g'
            );
        }

        return text.replace(sRE, '\\$1');
    }

    matches(leftValue, rightValue) {
        if (!rightValue)
            return leftValue === rightValue;

        var likeExpr = this.escapeChars(rightValue);
        return new RegExp(likeExpr.replace("%", ".*").replace("_", ".")).exec(leftValue) != null
    }

    in(leftValue, rightValue) {
        if (!(rightValue instanceof Array))
            throw new Error('Instance of Array is expected for "in" operation.');

        return rightValue.indexOf(leftValue) !== -1;
    }

    operateOn(leftValue, rightValue) {
        var result;
        switch (this.expressionValue) {
            case '=':
                result = leftValue === rightValue;
                break;
            case '>':
                result = leftValue > rightValue;
                break;
            case '>=':
                result = leftValue >= rightValue;
                break;
            case '<':
                result = leftValue < rightValue;
                break;
            case '<=':
                result = leftValue <= rightValue;
                break;
            case '<>':
                result = leftValue !== rightValue;
                break;
            case 'LIKE':
                result = this.matches(leftValue, rightValue);
                break;
            case 'NOT LIKE':
                result = !this.matches(leftValue, rightValue);
                break;
            case 'IN':
                result = this.in(leftValue, rightValue);
                break;
            case 'IS NULL':
                result = leftValue === null;
                break;
            case 'IS NOT NULL':
                result = leftValue !== null;
                break;
            default:
                throw new Error('Not expected to reach here.');
        }
        return result;
    }
}

module.exports = ApatiteComparisionOperatorExpression;