var TestCase = require('njsunit').TestCase
var ApatiteTestUtil = require('../apatite-test-util.js')
var util = new ApatiteTestUtil()

class ApatiteCacheTestCase extends TestCase {
    constructor() {
        super()
    }

    testCache(onTestPerformed) {
        var self = this
        util.newSession(function (err, session) {

            util.apatite.defaultCacheSize = 5

            //ensure all objects loaded in cache
            var query = util.newQueryForPet(session)
            session.execute(query, function (err, allPets) {
                self.assertEqual(allPets.length, 4)
                var pet = session.findObjectInCache('Pet', '1')
                self.assertEqual(pet, allPets[0])
                pet = session.findObjectInCache('Pet', '2')
                self.assertEqual(pet, allPets[1])
                pet = session.findObjectInCache('Pet', '3')
                self.assertEqual(pet, allPets[2])
                pet = session.findObjectInCache('Pet', '4')
                self.assertEqual(pet, allPets[3])
                pet = session.findObjectInCache('Pet', '5')
                self.assertEqual(pet, null)
            })
            self.assertEqual(session.connection.sqlCount, 1)
            util.apatite.defaultCacheSize = 2
            session.clearCache()
            //if the cache size reached its capacity, remove objects which were inserted first
            session.execute(query, function (err, allPets) {
                self.assertEqual(allPets.length, 4)
                var pet = session.findObjectInCache('Pet', '1')
                self.assertEqual(pet, null)
                pet = session.findObjectInCache('Pet', '2')
                self.assertEqual(pet, null)
                pet = session.findObjectInCache('Pet', '3')
                self.assertEqual(pet, allPets[2])
                pet = session.findObjectInCache('Pet', '4')
                self.assertEqual(pet, allPets[3])
            })
            util.apatite.defaultCacheSize = 100
            session.clearCache()

            self.assertEqual(session.connection.sqlCount, 2)
            //lazy loading of one-to-one mappings
            query = util.newQueryForPerson(session)
            session.execute(query, function (err, people) {
                self.assertEqual(people.length, 3)
                var person = session.findObjectInCache('Person', '1')
                self.assertEqual(person, people[0])
                person.pet.getValue(function (err, nullPet) {
                    self.assertEqual(nullPet, null)

                    person = session.findObjectInCache('Person', '2')
                    var pet = session.findObjectInCache('Pet', '1')
                    self.assertEqual(pet, null) // When loading person, pet should not be loaded from DB
                    self.assertEqual(person, people[1])

                    person.pet.getValue(function (err, validPet) {
                        self.assertEqual(validPet.oid, 1) // pet should be loaded now from DB
                        pet = session.findObjectInCache('Pet', '1')
                        self.assertEqual(person.pet.basicGetValue(), pet)

                        person = session.findObjectInCache('Person', '3')
                        pet = session.findObjectInCache('Pet', '2')
                        self.assertEqual(pet, null)
                        self.assertEqual(person, people[2])
                    })
                })

            })
            self.assertEqual(session.connection.sqlCount, 5)
            session.clearCache()
            query = util.newQueryForPet(session)
            //ensure objects are retured from cache if the where expression matches
            session.execute(query, function (err, allPets) {
                self.assertEqual(allPets.length, 4); // all pets are now in cache
                allPets[0]['someProp'] = 'someValue'
                var nameQuery = util.newQueryForPet(session);
                nameQuery.attr('name').eq('Dog')
                session.execute(nameQuery, function (err, dogs) {
                    self.assertEqual(dogs.length, 1)
                    self.assertEqual(dogs[0]['someProp'], 'someValue')
                })
                session.clearCache()
                session.execute(nameQuery, function (err, dogs) {
                    self.assertEqual(dogs.length, 1)
                    self.assertEqual(dogs[0]['someProp'], undefined)
                })
            })

            self.assertEqual(session.connection.sqlCount, 8)
            session.clearCache()
            query = util.newQueryForPet(session).attr('name').eq('Dog')
            session.execute(query, function (err, allPets) {
                self.assertEqual(allPets.length, 1)

                allPets[0].name = 'DogX'

                query = util.newQueryForPet(session).attr('name').eq('Dog')
                query.and.attr('oid').eq('1')
                session.execute(query, function (err, allPets2) {
                    self.assertEqual(allPets2.length, 0)

                    var pet = session.findObjectInCache('Pet', '1')
                    self.assertEqual(pet.name, 'DogX')

                    pet.name = 'Dog'

                    query = util.newQueryForPet(session).attr('name').eq('Dog')
                    query.or.attr('name').eq('Dog')
                    session.execute(query, function (err, allPets3) {
                        self.assertEqual(allPets3.length, 1)
                        session.connection.sqlCount = 0
                        query = util.newQueryForPet(session).attr('oid').eq(1)
                        session.execute(query, function (err, petsInCache) {
                            self.assertEqual(session.connection.sqlCount, 0) // no sql should be issued because pet with oid 1 is already in the cache.
                            self.assertEqual(petsInCache.length, 1)
                        })
                    })
                })
            })

            session.clearCache()
            query = util.newQueryForPet(session)
            session.execute(query, function (err, allPetsFromDB) {
                self.assertEqual(allPetsFromDB.length, 4)
                // set some dummy values, so that we know that all the objects returned are from the cache and not from the DB
                allPetsFromDB[0]['someProp'] = 'someValue0'
                allPetsFromDB[1]['someProp'] = 'someValue1'
                allPetsFromDB[2]['someProp'] = 'someValue2'
                allPetsFromDB[3]['someProp'] = 'someValue3'
                query = util.newQueryForPet(session)
                session.execute(query, function (err, allPetsFromCache) {
                    self.assertEqual(allPetsFromCache.length, 4)
                    self.assertEqual(allPetsFromCache[0]['someProp'], 'someValue0')
                    self.assertEqual(allPetsFromCache[1]['someProp'], 'someValue1')
                    self.assertEqual(allPetsFromCache[2]['someProp'], 'someValue2')
                    self.assertEqual(allPetsFromCache[3]['someProp'], 'someValue3')
                })
            })

            session.clearCache()
            //test load from cache with promise
            query = util.newQueryForPet(session)
            query.attr('oid').eq(1)
            self.assertNullOrUndefined(session.findObjectInCache('Pet', '1'))
            var promise = session.execute(query); // load pet with oid 1
            promise.then(function (pet) {
                self.assertNotNullOrUndefined(session.findObjectInCache('Pet', '1'))
                promise = session.execute(query) // should get the object from cache
                promise.then(function (petFromCache) {
                    onTestPerformed()
                })
            })
        })
    }

    testOneToManyCache() {
        var self = this
        util.newSession(function (err, session) {
            var allDepartments = session.getAllObjectsInCache('Department')
            self.assertEqual(allDepartments.length, 0)

            var allEmployees = session.getAllObjectsInCache('Employee')
            self.assertEqual(allEmployees.length, 0)

            util.apatite.defaultCacheSize = 50
            var query = util.newQueryForDepartment(session)
            session.execute(query, function (err, departments) {
                allDepartments = session.getAllObjectsInCache('Department')
                self.assertEqual(allDepartments.length, 3)

                allEmployees = session.getAllObjectsInCache('Employee')
                self.assertEqual(allEmployees.length, 0)

                allDepartments[0].employees.getValue(function (err, employees) {
                    self.assertEqual(employees.length, 2)

                    allEmployees = session.getAllObjectsInCache('Employee')
                    self.assertEqual(allEmployees.length, 2)
                })
            })
        })
    }
}

module.exports = ApatiteCacheTestCase