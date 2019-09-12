/**
 * @module services/DatabaseService
 * @author Devon Rojas
 * 
 * @requires {@link https://www.npmjs.com/package/mongodb|mongodb}
 * @requires helpers/Utils
 */

const MongoClient   = require("mongodb").MongoClient;
const Utils         = require("../helpers/utils.js");

const uri           = process.env.MONGODB_URI; // Heroku MongoDB add-on
var DB;

MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if(err) throw err;
    
    DB = client.db("heroku_zss53kwl");
});
process.on("SIGTERM", () => {
    DB.close();
})


/**
 * Adds a single document to database collection.
 * 
 * @name addToCollection
 * @function
 * 
 * @param {string}      collectionName  Collection in database to write to.
 * @param {Object}      data            Data object to write.
 * @param {Function}    writeOperation  Write operation function to specify data mapping.
 * 
 * @return {void}
 */
const addToCollection = async(collectionName, data, writeOperation) => {
    try {
        if(data instanceof Array) {
            throw new Error("Database operation only supports one element at a time.");
        }
        if(Utils.isNull(data)) {
            throw new Error("Data contains null values. Database operation stopped.");
        }

        let collection = await DB.collection(collectionName);

        let res = await collection.replaceOne(...writeOperation(data));
    } catch(error) {
        console.error(error.message);
        error.message = "Database error. Please contact server adminstrator for details."
        error.statusCode = 500;
        throw error;
    }
}

/**
 * Adds multiple documents to a collection.
 * 
 * @name addMultipleToCollection
 * @function
 * 
 * @param {string}      collectionName  Collection in database to write to.
 * @param {Object}      data            Data object to write.
 * @param {Function}    atomicOps       Atomic write operation function to specify data mapping.
 * 
 * @return {void}
 */
const addMultipleToCollection = async(collectionName, data, atomicOps) => {

    let collection = await DB.collection(collectionName);
    console.log("Collection <" + collectionName + ">" + " opened.");

    let atomic = atomicOps(data);

    process.stdout.write("Total documents to add: " + atomic.length);
    process.stdout.write("\nWriting documents to database.");

    let interval = setInterval(() => {
        process.stdout.write(".");
    }, 200)

    try {
        await collection.bulkWrite(atomic, { ordered: false });
        clearInterval(interval);
        process.stdout.write("Done.\n")
    } catch(error) {
        clearInterval(interval);
        process.stdout.write("\n")
        console.error(error);
        return;
    }
}

/**
 * Queries a collection for specific condition(s).
 * 
 * @name queryCollection
 * @function
 * 
 * @param {string} collectionName   Collection in database to query.
 * @param {Object} query            Query parameters.
 * 
 * @return {void}
 */
const queryCollection = async(collectionName, query) => {
    let collection = await DB.collection(collectionName);
    let res = await collection.find(query).toArray();
    return res;
}

/**
 * Deletes a single document from a collection.
 * 
 * @name deleteOne
 * @function
 * 
 * @param {string} collectionName   Collection in database to delete document from.
 * @param {Object} query            Query parameter to find document to delete.
 * 
 * @return {void}
 */
const deleteOne = async(collectionName, query) => {
    let collection = await DB.collection(collectionName);
    console.log("Collection <" + collectionName + "> opened");

    let res = await collection.deleteOne(query);
    console.log("Document deleted.");
}

/**
 * Deletes multiple documents from a collection.
 * 
 * @name deleteMany
 * @function
 * 
 * @param {string} collectionName   Collection in database to delete documents from.
 * @param {Object} query            Query paramater(s) to find documents to delete.
 * 
 * @return {void}
 */
const deleteMany = async(collectionName, query) => {

    let collection = await DB.collection(collectionName);
    console.log("Collection <" + collectionName + "> opened");

    let res = await collection.deleteMany(query);
    if(res.result.ok) {
        console.log(res.result.n + " documents deleted.");
    }
}

/**
 * Updates multiple documents in a collection.
 * 
 * @name updateMany
 * @function
 * 
 * @param {string}      collectionName  Collection in database to update documents in.
 * @param {Object}      query           One or more query conditions to specify update operation.
 * 
 * @return {void}
 */
const updateMany = async(collectionName, query) => {

    let collection = await DB.collection(collectionName);
    console.log("Collection <" + collectionName + "> opened");

    let res = await collection.updateMany(...query);
    console.log("Updated " + res.result.n + " documents.");
}

const updateOne = async(collectionName, query) => {

    let collection = await DB.collection(collectionName);
    console.log("Collection <" + collectionName + "> opened");

    let res = await collection.updateOne(...query);
    console.log("Updated " + res.result.n + " documents.");
}

/** 
 * @name cleanCollections
 * @function
 * 
 * @return {void}
 */
const cleanCollections = async() => {

    let careersCollection = DB.collection("careers");
    let jobTrackingCollection = DB.collection("job_tracking");

    let careers = await careersCollection.find().toArray();
    let jobTracking = await jobTrackingCollection.find().toArray();

    careers = careers.map(career => career._code);
    jobTracking = jobTracking.map(career => career._code);

    console.log("Cleaning careers and job_tracking collections for missing data...");

    if(careers.length > jobTracking.length) {
        careers.forEach(async(code) => {
            if(!jobTracking.includes(code)) {
                await careersCollection.deleteOne({"_code": code});
                console.log("Deleted " + code + " from careers collection.");
            }
        })
    } else if(jobTracking.length > careers.length) {
        jobTracking.forEach(async(code) => {
            if(!careers.includes(code)) {
                await jobTrackingCollection.deleteOne({"_code": code});
                console.log("Deleted " + code + " from job_tracking collection.");
            }
        })
    }
}

module.exports = {
    addToCollection,
    addMultipleToCollection,
    queryCollection,
    deleteMany,
    deleteOne,
    updateMany,
    updateOne,
    cleanCollections
}