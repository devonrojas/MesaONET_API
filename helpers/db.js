const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

const throttle = require('./throttle.js');

const config = {
    username: "devonrojas",
    password: "DarkBlue1!"
}

const uri = process.env.MONGODB_URI; // Heroku MongoDB add-on

const addToCollection = async(collectionName, data) => {
    MongoClient.connect(uri, { useNewUrlParser: true }, async(err, client) => {
        if(err) {
            console.error(err);
        } else {
            let DB = client.db("heroku_zss53kwl");
            console.log("Successfully connected to database.")
    
            let collection = DB.collection(collectionName);
            console.log("Collection <" + collectionName + ">" + " opened.");
    
            let start = Date.now();
    
            let res = await collection.replaceOne(
                { careercode: data['careercode'] }, 
                { 
                    jobcount: data['jobcount'],
                    lastUpdated: data['lastUpdated'],
                    careercode: data['careercode']
                }, 
                { upsert: true });
    
            let end = Date.now();
            let duration = end - start;
    
            if(res.modifiedCount == 0) {
                console.log("No document exists for " + data['careercode'] + ".")
                console.log("Creating document...");
            }
    
            let waitint = 100;
            process.stdout.write("Writing document to collection")
            let interval = setInterval(function() {
                process.stdout.write(".")
            }, waitint);
    
            await timeout(duration * waitint / 10);
    
            clearInterval(interval);
            process.stdout.write("\nWrite operation successful.\n")
    
            db.close();
            console.log("Database connection closed.");
        }
    })   
}

const addMultipleToCollection = async(collectionName, data) => {
    MongoClient.connect(uri, { useNewUrlParser: true }, async(err, client) => {
        if(err) {
            console.error(err)
        } else {
            let DB = client.db("heroku_zss53kwl");
            console.log("\nSuccessfully connected to database.");
    
            let collection = DB.collection(collectionName);
            console.log("Collection <" + collectionName + ">" + " opened.");
    
            let atomic = data.map(item => {
                return {
                    replaceOne: {
                        "filter": { careercode: item['careercode'] },
                        "replacement": { 
                            jobcount: item['jobcount'],
                            lastUpdated: item['lastUpdated'],
                            careercode: item['careercode']
                        },
                        "upsert": true
                    }
                }
            });
    
            process.stdout.write("Total documents to add: " + atomic.length);
            process.stdout.write("\nWriting documents to database.");
    
            let interval = setInterval(() => {
                process.stdout.write(".");
            }, 200)
    
            try {
                let res = await collection.bulkWrite(atomic, { ordered: false });
                clearInterval(interval);
                process.stdout.write("\nDone.\n")
            } catch(error) {
                clearInterval(interval);
                process.stdout.write("\n")
                console.error(error);
            } finally {
                await timeout(2000);
                db.close();
            }
        }
    })
}

const queryCollection = async(collectionName, query) => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(uri, { useNewUrlParser: true }, async(err, client) => {
            if(err) {
                console.log(err);
                reject(err);
            } else {
                let DB = client.db("heroku_zss53kwl");
                // console.log("\nSuccessfully connected to database.");
        
                let collection = DB.collection(collectionName);
                // console.log("Collection <" + collectionName + "> opened");
        
                // console.log("Searching documents for: " + JSON.stringify(queryObj));
                let res = collection.find(query).toArray();
    
                db.close();
                resolve(res);
            }
        })
    })
}

const queryMultiple = async(collectionName, queryArr) => {
    let calls = [];

    return new Promise((resolve, reject) => {
        MongoClient.connect(uri, { useNewUrlParser: true }, async(err, client) => {
            if(err) {
                console.error(err);
                reject(err);
            } else {
                let DB = client.db("heroku_zss53kwl");
                console.log("\nSuccessfully connected to database.");
        
                let collection = DB.collection(collectionName);
                console.log("Collection <" + collectionName + "> opened");
        
                queryArr.forEach(query => {
                    calls.push(async(cb) => {
                        console.log("Querying " + JSON.stringify(query));
                        let res = await collection.find(query).toArray();
                        if(res) {
                            cb(res[0]);
                        } else {
                            let r = {
                                careercode: query.careercode,
                                career: null
                            }
                            cb(query.careercode);
                        }
                    })
                });
                let res = await throttle(calls, 50, 1000);
                db.close();
                console.log("Connection closed.");
                resolve(res);
            }
        })
    })
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    addToCollection,
    addMultipleToCollection,
    queryCollection,
    queryMultiple
}