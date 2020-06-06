var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()

class ApatiteInheritanceQueryResultTestCase extends TestCase {
    constructor() {
        super()
    }

    testQueryResult() {
        var self = this
        util.newSession(function (err, session) {
            var query = util.newQueryForShape(session)
            session.execute(query, function (err, allShapes) {
                self.assertEqual(allShapes.length, 4)
                self.assertEqual(allShapes[0].constructor.name, 'Circle')
                self.assertEqual(allShapes[1].constructor.name, 'ShapeWithVertex')
                self.assertEqual(allShapes[2].constructor.name, 'ShapeWithVertex')
                self.assertEqual(allShapes[3].constructor.name, 'SemiCircle')
            })

            query = util.newQueryForCircle(session)
            session.execute(query, function (err, allCircles) {
                self.assertEqual(allCircles.length, 1)
                self.assertEqual(allCircles[0].constructor.name, 'Circle')
            });

            query = util.newQueryForSemiCircle(session)
            session.execute(query, function (err, allSemiCircles) {
                self.assertEqual(allSemiCircles.length, 1)
                self.assertEqual(allSemiCircles[0].constructor.name, 'SemiCircle')
            })

            query = util.newQueryForShapeWithVertex(session)
            session.execute(query, function (err, allShapesWithVertices) {
                self.assertEqual(allShapesWithVertices.length, 2)
                self.assertEqual(allShapesWithVertices[0].constructor.name, 'ShapeWithVertex')
                self.assertEqual(allShapesWithVertices[1].constructor.name, 'ShapeWithVertex')
            })
        })
    }
}

module.exports = ApatiteInheritanceQueryResultTestCase