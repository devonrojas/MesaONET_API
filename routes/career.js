/**
 * @module routes/career
 * @author Devon Rojas
 * 
 * @requires {@link https://www.npmjs.com/package/express| express}
 * @requires {@link https://www.npmjs.com/package/request-promise| request-promise}
 * 
 * @requires services/DatabaseService
 * @requires services/CareerOneStopService
 */

require("dotenv").config();
const express = require('express');
const rp = require("request-promise");

/**
 * @type {object}
 * @const
 * @namespace careerRouter
 */
const Router = express.Router();

// Module imports
const db = require("../services/DatabaseService.js");
const JobTracker = require("../models/JobTracker.js");

const GOOGLE_MAPS_API_KEY =
    process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_URI =
    "https://maps.googleapis.com/maps/api/geocode/json?address=";

/**
 * Retrieves all [Careers]{@link module:models/Career} in database.
 * 
 * @name GET/
 * @function
 * @memberof module:routes/career~careerRouter
 */
Router.get("/", async(req, res) => {
    try {
        // Empty query to return all documents in careers collection
        let careers = await db.queryCollection("careers", {});
        careers = careers.map(career => {
            return {
                title: career._title,
                code: career._code
            }
        }).sort((a, b) => {
            const codeA = a.code;
            const codeB = b.code;

            let comp = 0;
            if(codeA > codeB) {
                comp = 1;
            } else if(codeA < codeB) {
                comp = -1;
            } 
            return comp
        });
        res.status(200).send({careers, total: careers.length});
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
 * Retrieves occupation information associated with a career
 * code, location, and radius.
 * 
 * @name GET/career/:code/:location/:radius
 * @function
 * @memberof module:routes/career~careerRouter
 *
 * @param {string} code     Occupation code to look up
 * @param {string} location Location to retrieve occupation data around
 * @param {number} radius   Distance from location to search
 */
Router.get("/:code/:location/:radius", async (req, res) => {
    let code = req.params.code
        ? req.params.code
        : res.status(400).send("Please provide an ONET Code.");
    let location = req.params.location
        ? req.params.location
        : res
              .status(400)
              .send(
                  "Please provide a location ('US', 'CA', '92111', 'San Diego', etc.)"
              );
    let radius = req.params.radius
        ? req.params.radius
        : res.status(400).send("Please specify a radius.");

    res.setHeader("Access-Control-Allow-Origin", "*");

    console.log("Searching for career...");
    let career = await db.queryCollection("careers", {"_code": code})
    if (career.length > 0) {
        console.log("Career found!");
        career = career[0];

        let url = GOOGLE_MAPS_URI + location + "&key=" + GOOGLE_MAPS_API_KEY;
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

        let query = {
            careercode: code,
            "jobcount.area": { $in: Object.values(location) }
        };

        let jobs = await db.queryCollection("job_tracking", query); // Query database with career code & area

        let writeOperation = data => {
            return [
                { careercode: data["careercode"] },
                {
                    jobcount: data["jobcount"],
                    lastUpdated: data["lastUpdated"],
                    careercode: data["careercode"]
                },
                { upsert: true }
            ];
        };

        if (jobs && jobs.length > 0) {
            console.log("=".repeat(20));
            console.log("No location data exists for " + code);
            console.log("=".repeat(20));
            c = await JobTracker.pullData(jobs[0], code, location);
            console.log("=".repeat(20));
            console.log(
                "Updating " +
                    code +
                    " with \n" +
                    JSON.stringify(location, undefined, 2) +
                    "\ndata"
            );
            console.log("=".repeat(20));
            console.log("Updating database...");
            await db.addToCollection("job_tracking", c.career, writeOperation);
        } else {
            // Location doesn't exist in database
            jobs = await db.queryCollection("job_tracking", {
                careercode: code
            }); // Try query with just career code
            if (jobs && jobs.length > 0) {
                console.log("=".repeat(20));
                console.log("No location data exists for " + code);
                console.log("=".repeat(20));
                c = await JobTracker.pullData(jobs[0], code, location);
                console.log("=".repeat(20));
                console.log(
                    "Updating " +
                        code +
                        " with \n" +
                        JSON.stringify(location, undefined, 2) +
                        "\ndata"
                );
                console.log("=".repeat(20));
                console.log("Updating database...");
                await db.addToCollection(
                    "job_tracking",
                    c.career,
                    writeOperation
                );
            } else {
                // No sort of data exists for career
                console.log("=".repeat(20));
                console.log("No data exists for " + code);
                console.log("=".repeat(20));
                c = await JobTracker.pullData(null, code, location);
                console.log("Adding " + code + " to database...");
                await db.addToCollection(
                    "job_tracking",
                    c.career,
                    writeOperation
                );
                jobs[0] = c.career;
            }
        }

        if (jobs[0].hasOwnProperty("jobcount")) {
            career["jobcount"] = jobs[0].jobcount;
        }

        console.log("Career retrieval complete.");
        res.status(200).send(career);
    } else
        return res
            .status(400)
            .send("Could not locate career. Please try again.");
});

module.exports = Router;