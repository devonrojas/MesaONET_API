/**
 * @module routes/admin
 * @author Devon Rojas
 * 
 * @requires {@link https://www.npmjs.com/package/express| express}
 * 
 * @requires services/DatabaseService
 * @requires services/DataExportService
 * @requires models/AcademicProgram
 * @requires helper/Utils
 */

require("dotenv").config();
const express = require('express');

/**
 * @type {object}
 * @const
 * @namespace adminRouter
 */
const Router = express.Router();

// Module imports
const db = require("../services/DatabaseService.js");
const JobTracker = require("../models/JobTracker.js");
const AcademicProgram = require("../models/AcademicProgram.js");
const Throttler = require("../models/Throttler.js");
const DataExportService = require("../services/DataExportService.js");
const Utils = require("../helpers/utils.js");

/**
 * @name GET/
 * @function
 * @memberof module:routes/admin~adminRouter
 */
Router.get("/test", async(req, res) => {
    let j = new JobTracker("15-1134.00", {zip: "94123"});
    await j.retrieveData();
    res.status(200).send("Request received. Pulling data...");

    // let careers = await db.queryCollection("careers", {});
    // if(careers.length > 0) {
    //     await Utils.asyncForEach(careers, async(career, index) => {
    //         console.log("[" + (index + 1) + "/" + careers.length + "] Retrieving data for " + career._title + "...");
    //         let j = new JobTracker(career._code, {zip: "92025"});
    //         await j.retrieveData();

    //         const writeOperation = (data) => [
    //             { "_code": data["_code"] },
    //             {
    //                 "_code": data["_code"],
    //                 "_areas": data.getAreas(),
    //                 "lastUpdated": Date.now()
    //             },
    //             { upsert: true}
    //         ]
    //         await db.addToCollection("job_tracking", j, writeOperation)
    //     })
    //     console.log("\nAll careers have been retrieved.")
    // }
})

Router.get("/update-job-tracking", async(req, res) => {
    try {
        res.status(200).send("Request received. Checking if job tracking data needs updating. Review server logs for details.");
        let careers = await db.queryCollection("job_tracking", {});
        if(careers.length > 0) {
            careers = careers.map(career => career._code);
            let operations = await new Throttler(careers, 1, 1000).execute();
            console.log("Job Tracking data updated. Total careers: " + operations.length);
        }
    } catch(error) {
        console.error(error.message);
        // if(error.statusCode) {
        //     res.status(error.statusCode).send(error.message);
        // } else {
        //     res.status(500).send(error.message);
        // }
    }
})

/**
 * Pulls new program and occupation data.
 * 
 * @name GET/generate
 * @function
 * @memberof module:routes/admin~adminRouter
 */
Router.get("/generate", async (req, res) => {
    res.status(200).send("Request received.");

    let careers = ACADEMIC_PROGRAM_DATA.map(program =>
        program.careers.map(career => career.code)
    );
    let merged = [].concat.apply([], careers).sort();
    let data = [...new Set(merged)]; // Remove all duplicate career codes

    let dbCalls = [];
    let calls = [];

    let start = Date.now();

    console.log();

    dbQueries = data.map(item => {
        return {
            careercode: item
        };
    });

    let results = await db.queryMultiple("job_tracking", dbQueries);

    await Utils.asyncForEach(data, async (career, idx) => {
        calls.push(async cb => {
            try {
                process.stdout.write(
                    "[" + (idx + 1) + "/" + data.length + "] "
                );
                process.stdout.write(
                    "Pulling data for career " + career + "\n"
                );
                let c = await JobTracker.pullData(null, career);
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

    let arr = await Utils.throttle(calls, 10, 1000);
    let errored = arr.filter(item => typeof item == "string");
    arr = arr.filter(item => typeof item == "object");

    dbCalls = errored.map(item => {
        return {
            careercode: item
        };
    });

    results = await db.queryMultiple("job_tracking", dbCalls);

    if (errored.length > 0) {
        let retryCalls = [];

        console.log("Careers with errors:");
        await Utils.asyncForEach(errored, (career, idx) => {
            console.log("\t" + career);
            retryCalls.push(async cb => {
                try {
                    process.stdout.write(
                        "[" + (idx + 1) + "/" + errored.length + "] "
                    );
                    process.stdout.write(
                        "Pulling data for career " + career + "\n"
                    );
                    let c = await JobTracker.pullData(null, career, location);
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
        retried = retried.filter(item => typeof item == "object");

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

    await db.addMultipleToCollection("job_tracking", arr, atomicOps);
    let end = Date.now();
    let duration = (end - start) / 1000;
    let t = " seconds";

    if (duration > 60) {
        duration = (duration / 60).toFixed(2);
        t = " minutes";
    }

    console.log("Complete. Total time elapsed: " + duration + t);
});

/**
 * @deprecated
 * 
 * Writes all careers within academic programs to database.
 * @name GET/export-careers
 * @function
 * @memberof module:routes/admin~adminRouter
 */
Router.get("/export-careers", async (req, res) => {
    res.setHeader("Access-Control-Origin-Allow", "*");
    res.status(200).send("Request received. Check server console for details.");

    const CAREERS = ACADEMIC_PROGRAM_DATA.map(program =>
        program.careers.map(career => career.code)
    );
    const MERGED = [].concat.apply([], CAREERS).sort();
    let data = [...new Set(MERGED)]; // Remove all duplicate career codes

    data = data
        .map(code => {
            let match;
            ACADEMIC_PROGRAM_DATA.forEach(program => {
                let c = program.careers.find(career => career.code == code);
                if (c) {
                    match = c;
                    return;
                }
            });
            return match;
        })
        .filter(item => item && item !== undefined)
        .map(item => {
            return {
                code: item.code,
                title: item.title,
                growth: item.growth,
                related_programs: ACADEMIC_PROGRAM_DATA.filter(x =>
                    x.careers.some(career => career.code == item.code)
                ).map(x => {
                    let path =
                        "/" +
                        x.title
                            .toLowerCase()
                            .replace("and ", "")
                            .replace(/['\/]|/g, "")
                            .replace(/ /g, "-") +
                        ".shtml";
                    return {
                        title: x.title,
                        path: path,
                        degree_types: x.degree_types
                    };
                })
            };
        });

    let exportedData = await new DataExportService().buildData(data);

    const DATA_EXPORT = exportedData.filter(obj =>
        Object.values(obj).every(v => v != null)
    );

    // Schema for MongoDB bulk write operations
    const atomicOps = DATA_EXPORT => {
        return DATA_EXPORT.map(item => {
            return {
                replaceOne: {
                    filter: { code: item["code"] },
                    replacement: {
                        code: item["code"],
                        title: item["title"],
                        growth: item["growth"],
                        salary: item["salary"],
                        technical_skills: item["technical_skills"],
                        tasks: item["tasks"],
                        education: item["education"],
                        jobcount: item["jobcount"],
                        related_programs: item["related_programs"],
                        lastUpdated: Date.now()
                    },
                    upsert: true
                }
            };
        });
    };

    await db.addMultipleToCollection("careers", DATA_EXPORT, atomicOps);
});

/**
 * @deprecated
 * 
 * Writes all academic programs from JSON file to database.
 * @name GET/export-programs
 * @function
 * @memberof module:routes/admin~adminRouter
 */
Router.get("/export-programs", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");

    const atomicOps = arr => {
        return arr.map(item => {
            return {
                replaceOne: {
                    filter: { title: item["title"] },
                    replacement: {
                        title: item["title"],
                        degree_types: item["degree_types"],
                        code: item["code"],
                        careers: item["careers"],
                        salary: item["salary"],
                        aggregate_growth: item["aggregate_growth"]
                    },
                    upsert: true
                }
            };
        });
    };

    process.stdout.write("Writing academic program data to database");
    let int = setInterval(() => {
        process.stdout.write(".");
    }, 100);
    await db.addMultipleToCollection(
        "academic_programs",
        ACADEMIC_PROGRAM_DATA,
        atomicOps
    );
    clearInterval(int);
    console.log();

    res.sendStatus(200);
});

module.exports = Router;