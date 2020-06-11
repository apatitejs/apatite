const ApatiteError = require('../error/apatite-error.js')
const expressionMapping = {
    '=': 'equals',
    '(': 'enclose',
    '|': 'or',
    '&': 'and',
    '>=': 'greaterOrEquals',
    '>': 'greaterThan',
    '<=': 'lessOrEquals',
    '<': 'lessThan',
    '!=': 'notEquals',
    '~': 'like',
    '!~': 'notLike'
}

class ApatiteQueryBuilder {
    constructor(expressionArr) {
        this.expressionArr = expressionArr
    }

    buildQuery(apatiteQuery) {
        if (!(this.expressionArr instanceof Array)) {
            throw new ApatiteError('Invalid expression array provided. Expression array must be an array.')
        }

        let currentExpr = apatiteQuery
        let prevExprs = []
        this.expressionArr.forEach((eachExpr) => {
            if (eachExpr instanceof Array) {
                if (eachExpr.length !== 3) {
                    throw new ApatiteError('Array expression must contain 3 elements.')
                }
                const leftExpr = currentExpr.attr(eachExpr[0])
                const operator = eachExpr[1]
                const rightExpr = eachExpr[2]
                if (rightExpr === null) {
                    if (operator === '=') {
                        currentExpr = leftExpr.isNULL()
                    } else {
                        currentExpr = leftExpr.isNOTNULL()
                    }
                } else {
                    currentExpr = leftExpr[expressionMapping[operator]](rightExpr)
                }
            } else {
                if (eachExpr === '(') {
                    prevExprs.push(currentExpr)
                    currentExpr = currentExpr.enclose
                } else if (eachExpr === ')') {
                    currentExpr = prevExprs.pop()
                } else {
                    currentExpr = currentExpr[expressionMapping[eachExpr]]
                }
            }
        })
    }
}
module.exports = ApatiteQueryBuilder