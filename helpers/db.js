/**
 * @module helpers/db
 * @author Devon Rojas
 * 
 * @requires mongodb
 * @requires {@link throttle}
 */

const MongoClient = require("mongodb").MongoClient;
const throttle = require('./throttle.js');

const uri = process.env.MONGODB_URI; // Heroku MongoDB add-on

/**
 * @name addToCollection
 * @function
 * 
 * @param {string} collectionName 
 * @param {Object} data 
 * @param {Function} writeOperation 
 * 
 * @return {void}
 */
const addToCollection = async(collectionName, data, writeOperation) => {
    try {
        if(data instanceof Array) {
            throw new Error("Database operation only supports one element at a time.");
        }
        if(isNull(data)) {
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
 * @name addMultipleToCollection
 * @function
 * 
 * @param {string} collectionName 
 * @param {Object} data 
 * @param {Function} atomicOps 
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
 * @name queryCollection
 * @function
 * 
 * @param {string} collectionName 
 * @param {Object} query 
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
 * @name queryMultiple
 * @function
 * 
 * @param {string} collectionName 
 * @param {Array} queryArr 
 * 
 * @return {void}
 */
const queryMultiple = async(collectionName, queryArr) => {
    let calls = [];

    let client = await MongoClient.connect(uri, { useNewUrlParser: true });
    let DB = await client.db("heroku_zss53kwl");
    console.log("\nSuccessfully connected to database.");

    let collection = await DB.collection(collectionName);
    console.log("Collection <" + collectionName + "> opened");

    queryArr.forEach(query => {
        calls.push(async(cb) => {
            console.log("Querying " + JSON.stringify(query));
            let res = await collection.find(query).toArray();
            if(res) {
                if(res.length > 0) {
                    cb(res[0]);
                // } else {
                //     let r = {
                //         careercode: query.careercode,
                //         career: null
                //     }
                //     cb(query.careercode);
                } else cb();
            } else cb();
        })
    });
    let res = (await throttle(calls, 5, 1000)).filter(item => item !== null && item !== undefined);
    await client.close();
    console.log("Connection closed.");
    return res;
}

/**
 * @name deleteOne
 * @function
 * 
 * @param {string} collectionName 
 * @param {Object} query 
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
 * @name deleteMany
 * @function
 * 
 * @param {string} collectionName 
 * @param {Object} query 
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
 * @name updateMany
 * @function
 * 
 * @param {string} collectionName 
 * @param {Object} query 
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

/**
 * @name isNull
 * @function
 * @inner
 * 
 * @param {Object} data 
 * 
 * @return {boolean} Boolean indicating if data has any null values.
 */
const isNull = (data) => {
    if(data instanceof Array) {
        return !data.every(item => {
            return !Object.values(item).every(val => val !== null && val !== undefined);
        })
    } else if(data instanceof Object) {
        return !Object.values(data).every(item => item !== null && item !== undefined);
    }
}

module.exports = {
    addToCollection,
    addMultipleToCollection,
    queryCollection,
    queryMultiple,
    deleteMany,
    deleteOne,
    updateMany,
    cleanCollections
}