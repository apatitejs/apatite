var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()

class ApatiteSessionTestCase extends TestCase {
    constructor() {
        super()
    }

    testSession() {
        var self = this
        util.newSession(function (err, session) {
            var changesToDo = function (changesDone) {
                //changesDone(); Not called intentionally so that the next call would give error
            }
            var onChangesSaved = function (err) {
            }
            session.doChangesAndSave(changesToDo, onChangesSaved)

            changesToDo = function (changesDone) {
                changesDone();
            }
            onChangesSaved = function (err) {
                self.assertEqual(err.message, 'Previous changes have not been saved. Probably the callback done() of changesToDo parameter of method doChangesAndSave(changesToDo, onChangesSaved) is not called.')
            }
            session.doChangesAndSave(changesToDo, onChangesSaved)

        })

        util.newSession(function (err, session) {
            var changesToDo = function (changesDone) {
                changesDone(new Error('Something went wrong while doing changes!'))
            };
            var onChangesSaved = function (err) {
                self.assertEqual(err.message, 'Something went wrong while doing changes!')
            }
            session.doChangesAndSave(changesToDo, onChangesSaved)
        })
    }
}

module.exports = ApatiteSessionTestCase