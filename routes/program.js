/**
 * @file Handles /program route requests.
 * @module routes/program
 * @author Devon Rojas
 * 
 * @requires {@link https://www.npmjs.com/package/express| express}
 * @requires {@link https://www.npmjs.com/package/request-promise|request-promsie}
 * 
 * @requires services/DatabaseService
 * @requires models/AcademicProgram
 * @requires models/Career
 * @requires helpers/Utils
 */

require("dotenv").config();
const express = require('express');
const rp = require("request-promise");

/**
 * @type {object}
 * @const
 * @namespace programRouter
 */
const Router = express.Router();

// Module imports
const db = require("../services/DatabaseService.js");
const AcademicProgram = require("../models/AcademicProgram.js");
const Career = require("../models/Career.js");
const Utils = require("../helpers/utils.js");

/**
 * Retrieves multiple [AcademicPrograms]{@link module:models/AcademicProgram} from
 * database and sends back all of their program data.
 * 
 * @name GET/bulk
 * @function
 * @memberof module:routes/program~programRouter
 * 
 * @see {@link module:services/DatabaseService|DatabaseService}
 * @see {@link module:helpers/Utils|Utils}
 * 
 * @param {Array} codes An array of program codes to fetch information for.
 * @example
 * // GET/program/bulk?codes=1&codes=2&...
 *  
 */
Router.get("/bulk", async(req, res) => {
    try {
        let codes;
        // Make sure appropriate query params are sent over
        if(req.query.codes) {
            if(Array.isArray(req.query.codes)) {
                codes = req.query.codes;
            } else {
                throw new Error("[codes] query param must be an array.");
            }
        } else {
            throw new Error("No program codes supplied. Please try again.");
        }
        let pArr = [];
        // Loop through each code and retrieve program data
        await Utils.asyncForEach(codes, async(code) => {
            if(isNaN(code)) {
                throw new Error("Program code must be a number.");
            }
            code = +code;
            let program = await db.queryCollection("programs", {"code": code});
            if(program.length > 0) {
                let p = Object.assign(new AcademicProgram(""), program[0]);
                pArr.push(p);
            } else {
                throw new Error("No program found. Please try again.")
            }
        })
        res.status(200).send(pArr);
    } catch(error) {
        console.error(error.message);
        if(error.statusCode) {
            res.status(error.statusCode).send(error.message);
        } else {
            res.status(404).send(error.message);
        }
    }
})

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
        },
        {
            name: "relevance_score",
            type: {
                name: "number",
                fn: !isNan
            }
        },
        {
            name: "soc_blacklist", 
            type: {
                name: "Array",
                fn: Utils.isArray
            }
        },
        {
            name: "soc_adds",
            type: {
                name: "Array",
                fn: Utils.isArray
            }
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
            let p = new AcademicProgram(data["title"], null, data["degree_types"], data["relevance_score"], data["soc_blacklist"], data["soc_adds"]);
            await p.retrieveAcademicProgramData();

            // Return program object as verification if successful
            res.status(201).send(p);

            // Clean careers and job-tracking data
            await db.cleanCollections();

            console.log("Program successfully created.");

            try {
                // Update search engine db
                console.log("Updating search engine...")
                const SEARCH_ENGINE_API = "https://polar-wave-14549.herokuapp.com/admin/";
                let options = {
                    uri: SEARCH_ENGINE_API + "program/" + p["code"],
                    method: "POST",
                    body: {
                        code: p["code"],
                        name: p["title"]
                    }
                }
                await rp(options);
                console.log("Program created in search engine.")
                await Utils.asyncForEach(p["_careers"], async(career) => {
                    try {
                        options["uri"] = SEARCH_ENGINE_API + "career/" + career["code"];
                        options["body"] = career;
                        await rp(options);
                    } catch(error) {
                        // Career exists in search engine db already
                        if(error.statusCode === 400) {
                            console.error(error.err);
                        } else {
                            console.error(error);
                        }
                    }
                    console.log("Career created in search engine.")
                })
            console.log("Search engine updated.")
            } catch(error) {
                // Program exists in search engine db already
                if(error.statusCode === 400) {
                    console.error(error.err);
                } else {
                    console.error(error);
                }
            }

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
        Object.keys(req.query).map(key => {
            if(req.query[key] === 'true') {
                req.query[key] = true;
            } else req.query[key] = false;
        })
        console.log(req.query);
        // Empty query to return all documents in programs collection
        let programs = await db.queryCollection("programs", {});

        programs = programs.map(program => {
            return !req.query.detail ? {
                title: program.title,
                code: program.code
            } : { 
                title: program.title, 
                code: program.code, 
                careers: program.careers, 
                degree_types: program.degree_types, 
                aggregate_salary: program.aggregate_salary, 
                url: program.url, 
                aggregate_growth: program.aggregate_growth 
            };
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
        let program = await db.queryCollection("programs", {"code": code});
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

/**
 * Updates a program
 * 
 * @name PUT/program/:code
 * @function 
 * @memberof module:routes/program~programRouter
 * 
 * @param {number} code Program code to update
 */
Router.put("/:code", async(req, res) => {
    let code = req.params.code;
    let data = req.body;

    const KEYS = [
        "title",
        "degree_types",
    ]

    if(code) {
        let validObj = data && Object.keys(data).every(key => KEYS.includes(key));
        if(validObj) {
            try {
                let p = await db.queryCollection("programs", {"code": +code });
                if(p.length > 0) {
                    p = Object.assign(new AcademicProgram(), p[0]);
                    if(data["degree_types"]) {
                        p["degree_types"] = data["degree_types"];
                    }
                    if(data["title"]) {
                        p["title"] = data["title"];
                        await p.updateCareers();
                    }
                } else {
                    res.status(404).send("No program found for code. If you are trying to create a program, please send a POST request to /program/");
                }
    
                let update = [
                    { "code": +code },
                    { $set: { ...p }},
                    { upsert: true }
                ]
                await db.updateOne("programs", update);
            
                res.status(200).send(p);
            } catch(error) {
                console.error(error);
                res.status(500).send(error.message);
            }
        } else {
            res.status(400).send("Invalid object. Please try again.");
        }
    } else {
        res.sendStatus(404);
    }
})

/**
 * Deletes a program
 * 
 * @name DELETE/program/:code
 * @function
 * @memberof module:routes/program~programRouter
 * 
 * @param {number} code Program code to delete
 */
Router.delete("/:code", async(req, res) => {
    let code = req.params.code;
    if(code) {
        try {
            let p = await db.queryCollection("programs", {"code": +code});
            if(p.length > 0) {
                await db.deleteOne("programs", {"code": code});
                res.status(200).send(p[0]["title"] + " program deleted.");
            } else {
                res.status(404).send("No program found for code.");
            }
        } catch(error) {
            res.status(500).send(error.message);
        }
    } else {
        res.sendStatus(404);
    }
})

/**
 * Adds a career to a program
 * 
 * @name POST/program/:code/career/:soc_code
 * @function
 * @memberof module:routes/program~programRouter
 * 
 * @param {number}  code        Program code to look up
 * @param {string}  soc_code    Career code to add to program
 */
Router.post("/:code/career/:soc_code", async(req, res) => {
    let code = req.params.code;
    let soc_code = req.params.soc_code;

    try {
        let p = await db.queryCollection("programs", {"code": +code});
        if(p.length > 0) {
            p = Object.assign(new AcademicProgram(), p[0]);
            if(!p.hasCareer(soc_code)) {
                let c = await db.queryCollection("careers", {"code": soc_code });
                if(c.length > 0) {
                    c = Object.assign(new Career(soc_code), c[0]);
                } else {
                    // Create new career;
                    c = new Career(soc_code);
                    c.setRelatedPrograms(await p._buildRelatedProgramData(c._code))
                    await c.retrieveCareerData();
                }
                let obj = {
                    _code: c._code,
                    title: c.title,
                    _growth: c._growth,
                    _salary: c._salary["NationalWagesList"][0]
                }
                await p.addCareer(obj);
                let update = [
                    { "code": +code },
                    { $set: { ...p }},
                    { upsert: true }
                ]
                await db.updateOne("programs", update);
                res.status(201).send(soc_code + " successfully added to " + p["title"] + " program.");
            } else {
                res.status(409).send(p.title + " program already contains code " + soc_code + ".");
            }
        } else {
            res.status(404).send("No program found. Please try again.")
        }
    } catch(error) {
        res.status(500).send(error.message);
    }
})

/**
 * Deletes a career from a program
 * 
 * @name DELETE/program/:code/career/:soc_code
 * @function
 * @memberof module:routes/program~programRouter
 * 
 * @param {number}  code        Program code to look up
 * @param {string}  soc_code    Career code to delete from program
 */
Router.delete("/:code/career/:soc_code", async(req, res) => {
    let code = req.params.code;
    let soc_code = req.params.soc_code;
    if(code) {
        try {
            let p = await db.queryCollection("programs", {"code": +code});
            if(p.length > 0) {
                p = Object.assign(new AcademicProgram(), p[0]);
                if(p.hasCareer(soc_code)) {
                    await p.removeCareer(soc_code);
                    let update = [
                        { "code": +code },
                        { $set: { ...p }},
                        { upsert: true }
                    ]
                    await db.updateOne("programs", update);
                    res.status(200).send(soc_code + " deleted from " + p["title"] + " program.");
                } else{
                    res.status(404).send(p.title + " program does not contain code " + soc_code + ".");
                }
            } else {
                res.status(404).send("No program found for code.");
            }
        } catch(error) {
            console.error(error);
            res.status(500).send(error.message);
        }
    } else {
        res.sendStatus(404);
    }
})

/**
 * Retrieves a program title
 * 
 * @name GET/program/:code/title
 * @function
 * @memberof module:routes/program~programRouter
 * 
 * @param {number}  code        Program code to look up
 */
Router.get("/:code/title", async(req,res) => {
    let code = req.params.code;
    try {
        if(isNaN(code)) {
            throw new Error("Program code must be a number.");
        }
        code = +code;
        let program = await db.queryCollection("programs", {"code": code});
        console.log(program);
        if(program.length > 0) {
            res.setHeader("Content-Type", "application/json");
            res.status(200).send(program[0]["title"]);
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
