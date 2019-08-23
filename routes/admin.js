/**
 * @module routes/admin
 * @author Devon Rojas
 * 
 * @requires express
 * @requires request-promise
 */

require("dotenv").config();
const express = require('express');
const rp = require("request-promise");

/**
 * @type {object}
 * @const
 * @namespace adminRouter
 */
const Router = express.Router();

// Module imports
const db = require("../helpers/db.js");
const throttle = require("../helpers/throttle.js");
const JobTracker = require("../helpers/job_tracker.js");
const DataExportService = require("../services/DataExportService.js");

const ACADEMIC_PROGRAM_DATA = require("../academic_programs.json");
const MESA_PROGRAMS = require("../mesa_academic_programs_new.json");

const GOOGLE_MAPS_API_KEY =
    process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_URI =
    "https://maps.googleapis.com/maps/api/geocode/json?address=";


/**
 * @name get/export-careers
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
 * @name get/export-programs
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

const AcademicProgram = require("../models/AcademicProgram.js");

Router.get("/test", async(req, res) => {
    let msg = "Generating " + MESA_PROGRAMS.length + " programs:";
    MESA_PROGRAMS.forEach((program) => {
        msg += "\n" + program.title;
    });
    res.status(200).send("Request received. " + msg);
    await asyncForEach(MESA_PROGRAMS, async(program, index) => {
        console.log("[" + (index + 1) + "/" + MESA_PROGRAMS.length + "] " + "Building " + program.title + " program.");

        let p = new AcademicProgram(program.title, program.degree_types);
        await p._retrieveAcademicProgramData();
    })
    console.log("\nDone!\n");
})

/**
 * Method: GET
 * Pulls new program and occupation data
 * 
 * @name get/generate
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

    let url = GOOGLE_MAPS_URI + "92111" + "&key=" + GOOGLE_MAPS_API_KEY;
    let options = {
        json: true
    };

    let local = (await rp(url, options)).results[0].address_components;

    location = local
        .filter(
            c =>
                c.types.includes("postal_code") ||
                c.types.includes("administrative_area_level_2") ||
                c.types.includes("administrative_area_level_1")
        )
        .map(c => {
            let a = c.types[0];
            a =
                a == "postal_code"
                    ? "zip"
                    : a == "administrative_area_level_2"
                    ? "county"
                    : (a = "adminstrative_area_level_1")
                    ? "state"
                    : null;

            let obj = {};
            obj[a] = c.short_name;
            return obj;
        })
        .reduce((res, cur) => {
            return Object.assign(res, cur);
        }, {});

    await asyncForEach(data, async (career, idx) => {
        calls.push(async cb => {
            try {
                process.stdout.write(
                    "[" + (idx + 1) + "/" + data.length + "] "
                );
                process.stdout.write(
                    "Pulling data for career " + career + "\n"
                );
                let c = await JobTracker.pullData(null, career, location);
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

    let arr = await throttle(calls, 10, 1000);
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
        await asyncForEach(errored, (career, idx) => {
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

        let retried = await throttle(retryCalls, 5, 1000);
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

const asyncForEach = async (arr, cb) => {
    for (let i = 0; i < arr.length; i++) {
        await cb(arr[i], i, arr);
    }
};

module.exports = Router;