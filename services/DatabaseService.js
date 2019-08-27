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
        let client = await MongoClient.connect(uri, { useNewUrlParser: true });
        let DB = await client.db("heroku_zss53kwl");
        // console.log("Successfully connected to database.")

        let collection = await DB.collection(collectionName);
        // console.log("Collection <" + collectionName + ">" + " opened.");

        let start = Date.now();

        let res = await collection.replaceOne(...writeOperation(data));

        let end = Date.now();
        let duration = end - start;

        if(res.modifiedCount == 0) {
            let code = data['careercode'] || data['code'] || data['_code'];
            console.log("No document exists for " + code + ".")
            console.log("Creating document...");
        }

        // let waitint = 100;
        // process.stdout.write("Writing document to collection")
        // let interval = setInterval(function() {
        //     process.stdout.write(".")
        // }, waitint);

        // await timeout(duration * waitint / 10);

        // clearInterval(interval);
        // process.stdout.write("\nWrite operation successful.\n")

        await client.close();
        // console.log("Database connection closed.");
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
    let client = await MongoClient.connect(uri, { useNewUrlParser: true })
    let DB = await client.db("heroku_zss53kwl");
    console.log("\nSuccessfully connected to database.");

    let collection = await DB.collection(collectionName);
    console.log("Collection <" + collectionName + ">" + " opened.");

    let atomic = atomicOps(data);
    console.log(atomic.slice(0, 10));

    process.stdout.write("Total documents to add: " + atomic.length);
    process.stdout.write("\nWriting documents to database.");

    let interval = setInterval(() => {
        process.stdout.write(".");
    }, 200)

    try {
        await collection.bulkWrite(atomic, { ordered: false });
        clearInterval(interval);
        process.stdout.write("Done.\n")
        await client.close();

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
    let client = await MongoClient.connect(uri, { useNewUrlParser: true });
    const DB = await client.db("heroku_zss53kwl");
    // console.log("\nSuccessfully connected to database.");

    let collection = await DB.collection(collectionName);
    // console.log("Collection <" + collectionName + "> opened");

    // console.log("Searching documents for: " + JSON.stringify(query));
    let res = await collection.find(query).toArray();

    await client.close();
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
    let client = await MongoClient.connect(uri, {useNewUrlParser: true});
    let DB = await client.db("heroku_zss53kwl");
    console.log("\nSuccessfully connected to database.");


    let collection = await DB.collection(collectionName);
    console.log("Collection <" + collectionName + "> opened");

    let res = await collection.deleteOne(query);
    console.log("Document deleted.");

    await client.close();
    console.log("Database connection closed.");
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
    let client = await MongoClient.connect(uri, {useNewUrlParser: true});
    let DB = await client.db("heroku_zss53kwl");
    console.log("\nSuccessfully connected to database.");

    let collection = await DB.collection(collectionName);
    console.log("Collection <" + collectionName + "> opened");

    let res = await collection.deleteMany(query);
    if(res.result.ok) {
        console.log(res.result.n + " documents deleted.");
    }
    await client.close();
    console.log("Database connection closed.");
}

/**
 * Updates multiple documents in a collection.
 * 
 * @name updateMany
 * @function
 * 
 * @param {string}      collectionName  Collection in database to update documents in.
 * @param {...Object}   query           One or more query conditions to specify update operation.
 * 
 * @return {void}
 */
const updateMany = async(collectionName, query) => {
    let client = await MongoClient.connect(uri, {useNewUrlParser: true});
    const DB = await client.db("heroku_zss53kwl");
    console.log("\nSuccessfully connected to database.");

    let collection = await DB.collection(collectionName);
    console.log("Collection <" + collectionName + "> opened");

    let res = await collection.updateMany(...query);
    console.log("Updated " + res.result.n + " documents.");

    await client.close();
    console.log("Database connection closed.")
}

/**
 * @deprecated
 * 
 * @name cleanCollections
 * @function
 * 
 * @return {void}
 */
const cleanCollections = async() => {
    MongoClient.connect(uri, { useNewUrlParser: true }, async(err, client) => {
        if(err) {
            console.error(err);
        } else {
            let DB = client.db("heroku_zss53kwl");
            let collection = DB.collection("academic_programs");
            let docs = await collection.find().toArray();

            // Get all valid codes associated with all academic programs
            let validCodes = [...new Set(
                [].concat
                .apply([], docs
                    .map(program => program.careers
                        .map(career => career.code))
                    .sort())
            )];
            
            // Scan careers collection for incomplete careers
            collection = DB.collection("careers");
            let toDelete = await collection.find({code: {$nin: validCodes}}).toArray();
            if(toDelete.length > 0) {
                console.log("The following codes will be deleted from 'careers':");
                toDelete.forEach(item => {
                    console.log("\t" + item.code)
                })
            }
            let res = await collection.deleteMany({ code: {$nin: validCodes}});
            if(res.result.n > 0) {
                console.log("Successfully deleted " + res.result.n + "documents.");
            }

            // Scan job_tracking collection for incomplete careers
            collection = DB.collection("job_tracking");
            toDelete = await collection.find({careercode: {$nin: validCodes}}).toArray();
            if(toDelete.length > 0) {
                console.log("The following codes will be deleted from 'job_tracking':");
                toDelete.forEach(item => {
                    console.log("\t" + item.careercode)
                })   
            }         
            res = await collection.deleteMany({careercode: {$nin: validCodes}})
            if(res.result.n > 0) {
                console.log("Successfully deleted " + res.result.n + "documents.");
            }

            client.close();
        }
    })
}

module.exports = {
    addToCollection,
    addMultipleToCollection,
    queryCollection,
    deleteMany,
    deleteOne,
    updateMany,
    cleanCollections
}