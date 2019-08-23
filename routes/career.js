/**
 * @module routes/career
 * @author Devon Rojas
 * 
 * @requires express
 * @requires request-promise
 */

const express = require('express');
const rp = require("request-promise");

/**
 * @type {object}
 * @const
 * @namespace careerRouter
 */
const Router = express.Router();

// Module imports
const db = require("../helpers/db.js");
const Program = require("../helpers/main.js");
const JobTracker = require("../helpers/job_tracker.js");
const CareerOneStop = require("../services/CareerOneStopService.js");


const ACADEMIC_PROGRAM_DATA = require("../academic_programs.json");

const GOOGLE_MAPS_API_KEY =
    process.env.GOOGLE_MAPS_API_KEY ||
    "AIzaSyCehU42t2h709gUgFvVdcXF6jFfptxKTbs";
const GOOGLE_MAPS_URI =
    "https://maps.googleapis.com/maps/api/geocode/json?address=";


/**
 * Method: GET
 * Retreives occupation information associated with a program
 * code, location, and radius.
 * 
 * @name get/career/:code/:location/:radius
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
                  "Please provide a location ('US', 'CA', '92111', 'San Diego', etc."
              );
    let radius = req.params.radius
        ? req.params.radius
        : res.status(400).send("Please specify a radius.");

    res.setHeader("Access-Control-Allow-Origin", "*");

    let match;
    console.log("Searching for career...");
    ACADEMIC_PROGRAM_DATA.forEach(program => {
        let c = program.careers.find(career => career.code == code);
        if (c) {
            match = c;
            return;
        }
    });
    if (match) {
        console.log("Career found!");

        let growth = match.growth;
        let title = match.title;

        let technical_skills = await Program.getCareerTechnicalSkills(code);

        let related = ACADEMIC_PROGRAM_DATA.filter(x =>
            x.careers.some(career => career.code == code)
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
        });

        let d = await CareerOneStop.fetch(
            code,
            title,
            growth,
            location,
            radius
        );
        d["technical_skills"] = technical_skills;
        d["related_programs"] = related;

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
            d["jobcount"] = jobs[0].jobcount;
        }

        console.log("Career retrieval complete.");
        res.status(200).send(d);
    } else
        return res
            .status(400)
            .send("Could not locate career. Please try again.");
});

const asyncForEach = async (arr, cb) => {
    for (let i = 0; i < arr.length; i++) {
        await cb(arr[i], i, arr);
    }
};

module.exports = Router;