/**
 * @module routes/program
 * @author Devon Rojas
 * 
 * @requires {@link https://www.npmjs.com/package/express| express}
 * 
 * @requires services/DatabaseService
 * @requires services/DataExportService
 * @requires models/AcademicProgram
 * @requires helpers/Utils
 */

require("dotenv").config();
const express = require('express');

/**
 * @type {object}
 * @const
 * @namespace programRouter
 */
const Router = express.Router();

// Module imports
const db = require("../services/DatabaseService.js");
const JobTracker = require("../models/JobTracker.js");
const DataExportService = require("../services/DataExportService.js");
const AcademicProgram = require("../models/AcademicProgram.js");

const Utils = require("../helpers/utils.js");

/**
 * Adds a new [AcademicProgram]{@link module:models/AcademicProgram} to database.
 * 
 * Checks to make sure program doesn't already exist in database. If it is
 * indeed new, then the relevant occupations and their data for the program 
 * are generated. All occupations pulled for this program are checked
 * against the job_tracking collection in the database to see if any new 
 * occupations have popped up. Any new occupations have their job
 * tracking data pulled for zip code 92111. Additionally, their
 * occupation data is added into the careers collection. If any of the
 * occupations have invalid/missing data, all instances of the occupation
 * in the database removed, so as to not cause any client-side errors.
 * Once all valid _new_ careers have been added to the database, all
 * occupations associated with the program have the program's title, url
 * and degree types added to its relevant_programs property.
 * 
 * @name POST/program
 * @function
 * @memberof module:routes/program~programRouter
 * 
 * @see [DatabaseService]   {@link module:services/DatabaseService}
 * @see [Utils]             {@link module:helpers/Utils}
 */
Router.post("/", async(req, res) => {
    res.setHeader("Allow-Access-Control-Origin", "*");
    const keys = [
        {
            name: "title",
            type: {
                name: "string",
                fn: Utils.isString
            }
        },
        {
            name: "degree_types",
            type: {
                name: "Array",
                fn: Utils.isArray
            },
            allowed_vals: [
                "AS Degree",
                "AA Degree",
                "Certificate of Achievement",
                "Certificate of Performance",
                "ADT"
            ]
        }
    ];

    let data = req.body;

    // Make sure JSON payload is formatted properly
    try {
        Object.keys(data).forEach(k => {
            let key = keys.find(ky => ky.name == k);
            if (key) {
                if (key.type.fn(data[k])) {
                    if (key.allowed_vals && Array.isArray(key.allowed_vals)) {
                        if (
                            !(
                                key.type.fn(data[k]) &&
                                data[k].every(item =>
                                    key.allowed_vals.includes(item)
                                )
                            )
                        ) {
                            throw new Error(
                                key.name + " contains invalid values."
                            ); // Reject
                        }
                    }
                } else
                    throw new Error(
                        "Payload incorrectly formatted. " +
                            k +
                            " must be of type " +
                            key.type.name
                    );
            } else {
                throw new Error("Payload incorrectly formatted."); // Reject
            }
        });
    } catch (error) {
        res.status(400).send(error.message);
        return;
    }

    try {
        // Check if program has already been generated in database
        let programExists = (await db.queryCollection("academic_programs", {
            title: data.title
        })).reduce((acc, cur) => {
            if(cur) return false;
            else return true;   
        }, true);

        if (programExists) {
            // Get all documents in programs collection for next code to generate in series

            let p = new AcademicProgram(...data);
            await p._retrieveAcademicProgramData();

            // Return program object as verification if successful
            res.status(201).send(p);

            // Check any new careers added against existing careers collection in database and pull any needed data
            let existingCareers = (await db.queryCollection("careers", {})).map(
                career => career.code
            );
            let newCareers = p.careers
                .map(career => career.code)
                .filter(career => existingCareers.indexOf(career) === -1);
            if (newCareers.length > 0) {
                console.log("\nNew careers found:");
                newCareers.forEach(career => {
                    console.log("\t" + career);
                });

                // Update job_tracking collection with new career codes
                let query = {careercode: {$in: newCareers }};
                existingCareers = (await db.queryCollection(
                    "job_tracking",
                    query
                ));
                newCareers = newCareers
                .filter(career => existingCareers
                    .map(item => item.careercode)
                    .indexOf(career) === -1);

                // Create record in job_tracking collection if career data doesn't exist already
                if (newCareers.length > 0) {

                    let location = {zip: '92111', state: 'CA', county: 'San Diego County'};

                    let calls = [];

                    // Career data pull
                    await Utils.asyncForEach(newCareers, async (career, idx) => {
                        calls.push(async cb => {
                            try {
                                process.stdout.write(
                                    "[" +
                                        (idx + 1) +
                                        "/" +
                                        newCareers.length +
                                        "] "
                                );
                                process.stdout.write(
                                    "Pulling data for career " + career + "\n"
                                );
                                let c = await JobTracker.pullData(
                                    null,
                                    career,
                                    location
                                );
                                if (c) {
                                    if (c.retry) {
                                        cb(c.career.careercode);
                                    } else {
                                        cb(c.career);
                                    }
                                }
                            } catch (error) {
                                process.stdout.write("\n");
                                console.log(error);
                                cb();
                            }
                        });
                    });

                    let arr = await Utils.Utils.throttle(calls, 10, 1000);
                    let errored = arr.filter(item => typeof item == "string");
                    arr = arr.filter(item => typeof item == "object");

                    // Run any errored careers again
                    if (errored.length > 0) {

                        let retryCalls = [];

                        console.log("Careers with errors:");
                        await Utils.asyncForEach(errored, (career, idx) => {
                            console.log("\t" + career);
                            retryCalls.push(async cb => {
                                try {
                                    process.stdout.write(
                                        "[" +
                                            (idx + 1) +
                                            "/" +
                                            errored.length +
                                            "] "
                                    );
                                    process.stdout.write(
                                        "Pulling data for career " +
                                            career +
                                            "\n"
                                    );
                                    let c = await JobTracker.pullData(
                                        null,
                                        career,
                                        location
                                    );
                                    if (c) {
                                        cb(c.career);
                                    }
                                } catch (error) {
                                    process.stdout.write("\n");
                                    console.log(error);
                                    cb();
                                }
                            });
                        });

                        let retried = await Utils.throttle(retryCalls, 5, 1000);
                        retried = retried.filter(
                            item => typeof item == "object"
                        );

                        arr = arr.concat(retried);
                    }

                    const atomicOps = arr => {
                        return arr.map(item => {
                            return {
                                replaceOne: {
                                    filter: { careercode: item["careercode"] },
                                    replacement: {
                                        jobcount: item["jobcount"],
                                        lastUpdated: item["lastUpdated"],
                                        careercode: item["careercode"]
                                    },
                                    upsert: true
                                }
                            };
                        });
                    };

                    // Add all new careers to job_tracking collection
                    await db.addMultipleToCollection(
                        "job_tracking",
                        arr,
                        atomicOps
                    );

                    // Update new careers array with codes that sucessfully pulled job tracking data
                    newCareers = p.careers.filter(career =>
                        arr.map(item => item.careercode).includes(career.code)
                    );
                    // Retrieve invalid careers to clean database with
                    invalidCareers = newCareers
                        .filter(
                            career =>
                                arr
                                    .map(item => item.careercode)
                                    .indexOf(career.code) === -1
                        )
                        .map(career => career.code);

                    let careerData = await new DataExportService().buildData(
                        newCareers
                    ); // Build career objects out of new career codes
                    let CLEANED_DATA = careerData
                    .filter(obj =>
                        Object.values(obj).every(v => v != null)
                    )
                    
                    await Utils.asyncForEach(CLEANED_DATA, async(item, index) => {
                        // Generate related programs for new careers
                        let relatedPrograms = await db.queryCollection("academic_programs", {"careers.code": item['code']});
                        relatedPrograms = relatedPrograms.map(program => {
                                let path =
                                "/" +
                                program.title
                                    .toLowerCase()
                                    .replace("and ", "")
                                    .replace(/['\/]|/g, "")
                                    .replace(/ /g, "-") +
                                ".shtml";
                            return {
                                title: program.title,
                                path: path,
                                degree_types: program.degree_types
                            };
                        });
                        let obj = {
                            ...item,
                            related_programs: relatedPrograms
                        }
                        CLEANED_DATA[index] = obj;
                    })

                    // Schema for MongoDB bulk write operations
                    const atomicOps2 = (CLEANED_DATA) => {
                        return CLEANED_DATA.map(item => {
                            return {
                                replaceOne: {
                                    filter: { code: item["code"] },
                                    replacement: {
                                        code: item["code"],
                                        title: item["title"],
                                        growth: item["growth"],
                                        salary: item["salary"],
                                        technical_skills:
                                            item["technical_skills"],
                                        tasks: item["tasks"],
                                        jobcount: item["jobcount"],
                                        related_programs: item['related_programs'],
                                        lastUpdated: Date.now()
                                    },
                                    upsert: true
                                }
                            };
                        });
                    };

                    console.log("Adding new careers to careers collection");
                    // Add all validated careers to careers collection
                    await db.addMultipleToCollection(
                        "careers",
                        CLEANED_DATA,
                        atomicOps2
                    );

                    // Update existing careers with new program data
                    let careersToUpdate = await db.queryCollection("careers", 
                    {"code": 
                        {$in: p.careers
                            .map(career => career.code)
                            .filter(career => CLEANED_DATA
                                .map(item => item.code)
                                .includes(career.code))
                        }
                    });

                    if(careersToUpdate.length > 0) {
                        let programData = {
                            title: p.title,
                            path: "/" +
                            p.title
                                .toLowerCase()
                                .replace("and ", "")
                                .replace(/['\/]|/g, "")
                                .replace(/ /g, "-") +
                            ".shtml",
                            degree_types: p.degree_types
                        }
                        let searchArr = [].concat.apply([], careersToUpdate.map(career => career.code));
                        let query = [
                            {"code": {$in: searchArr}},
                            { $push: { "related_programs": programData}},
                            {"upsert": true}
                        ]
                        
                        // Push new program data onto relevant careers
                        await db.updateMany("careers", query);
                    }

                    // Clean database collections
                    if (invalidCareers.length > 0) {
                        // Remove invalid careers from database collections
                        console.log(
                            "Removing invalid careers from careers collection."
                        );
                        let query = { careercode: { $in: invalidCareers } };
                        await db.deleteMany("careers", query);

                        console.log(
                            "Removing invalid careers from academic_programs collection."
                        );
                        query = {
                            "careers.code": { $in: invalidCareers }
                        };
                        await db.deleteMany("academic_programs", query);
                    }
                }
            } // End new careers check
        } // End existing program check
        else {
            res.status(200).send(data.title + " program exists already.");
        }
    } catch (error) {
        console.log(error);
        if (!res.headersSent) {
            if (error.statusCode) {
                res.status(error.statusCode).send(error.message);
            } else {
                res.status(400).send(error.message);
            }
        }
        return;
    }
});

/**
 * Retrieves all [AcademicPrograms]{@link module:models/AcademicProgram} from database 
 * and sends back their titles and codes.
 * 
 * @name GET/
 * @function
 * @memberof module:routes/program~programRouter
 * 
 * @see [DatabaseService]   {@link module:services/DatabaseService}
 */
Router.get("/", async(req, res) => {
    try {
        // Empty query to return all documents in programs collection
        let programs = await db.queryCollection("programs", {});
        programs = programs.map(program => {
            return {
                title: program._title,
                code: program._code
            }
        }).sort((a, b) => {
            const titleA = a.title.toLowerCase();
            const titleB = b.title.toLowerCase();
            let comp = 0;
            if(titleA > titleB) {
                comp = 1;
            } else if(titleA < titleB) {
                comp = -1;
            }
            return comp;
        })
        res.status(200).send({programs, total: programs.length});
    } catch(error) {
        console.error(error.message);
        if(error.statusCode) {
            res.status(error.statusCode).send(error.message);
        } else {
            res.sendStatus(500);
        }
    }
})

/**
 * Retrieves [AcademicProgram]{@link module:models/AcademicProgram} from database
 * using the program code.
 * 
 * @name GET/program/:code
 * @function
 * @memberof module:routes/program~programRouter
 * 
 * @param {number} code Program code to look up
 */
Router.get("/:code", async(req, res) => {
    let code = req.params.code;
    try {
        if(isNaN(code)) {
            throw new Error("Program code must be a number.");
        }
        code = +code;
        let program = await db.queryCollection("programs", {"_code": code});
        if(program.length > 0) {
            res.status(200).send(program[0]);
        } else {
            throw new Error("No program found. Please try again.")
        }
    } catch(error) {
        console.error(error.message);
        if(error.statusCode) {
            res.status(error.statusCode).send(error.message);
        } else {
            res.status(404).send(error.message);
        }
    }
});

module.exports = Router;