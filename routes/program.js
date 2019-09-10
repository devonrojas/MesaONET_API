/**
 * @file Handles /program route requests.
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
 * @see {@link module:services/DatabaseService|DatabaseService}
 * @see {@link module:helpers/Utils|Utils}
 */
Router.post("/", async(req, res) => {
    res.setHeader("Allow-Access-Control-Origin", "*");
    const SCHEMA = [
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
            let key = SCHEMA.find(ky => ky.name == k);
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
            // Build new program
            let p = new AcademicProgram(...Object.values(data));
            await p.retrieveAcademicProgramData();

            // Return program object as verification if successful
            res.status(201).send(p);

            // Clean careers and job-tracking data
            await db.cleanCollections();

            console.log("Program successfully created.");

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
 * @see {@link module:services/DatabaseService|DatabaseService}
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
            let p = Object.assign(new AcademicProgram(""), program[0]);
            await p.checkRelatedPrograms();
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

Router.get("/:code/title", async(req,res) => {
    let code = req.params.code;
    try {
        if(isNaN(code)) {
            throw new Error("Program code must be a number.");
        }
        code = +code;
        let program = await db.queryCollection("programs", {"_code": code});
        console.log(program);
        if(program.length > 0) {
            res.setHeader("Content-Type", "application/json");
            res.status(200).send(program[0]["_title"]);
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
})

module.exports = Router;