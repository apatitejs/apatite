'use strict';

class ApatiteUtil
{
    static selectUniqueObjects(arrOfObjects) {
        var uniqueObjects = [];
        arrOfObjects.forEach(function (eachObject) {
            if (uniqueObjects.indexOf(eachObject) === -1)
                uniqueObjects.push(eachObject);
        });
        return uniqueObjects;
    }

    static existsModule(moduleName) {
        try {
            require.resolve(moduleName);
            return true;
        }
        catch (ex) {
            return false;
        }
    }
}

module.exports = ApatiteUtil;