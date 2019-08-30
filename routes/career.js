/**
 * @file Handles /career route requests.
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

/**
 * @type {object}
 * @const
 * @namespace careerRouter
 */
const Router = express.Router();

// Module imports
const db = require("../services/DatabaseService.js");
const GoogleMapsService = require("../services/GoogleMapsService.js");

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
 * @param {string} code         Occupation code to look up
 * @param {string} location     Location to retrieve occupation data around
 * @param {number} [radius=25]  Distance from location to search
 */
Router.get("/:code/:location/:radius?", async (req, res) => {
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
        : 25; // miles

    console.log("Searching for career...");
    try {
        let career = await db.queryCollection("careers", {"_code": code})
        if (career.length > 0) {
            console.log("Career found!");
            career = career[0];
    
            let jobData = (await db.queryCollection("job_tracking", {"_code": code}))[0]._areas; // Query database with career code & area

            let loc = await GoogleMapsService.getCounty(location);
            
            if(loc) {
                loc = loc.short_name;
                jobData = jobData
                .filter(item => item.area.short_name === loc)
                .map(item => {
                    item.data = item.data
                        .filter(el => el._radius == radius);
                    return item;
                });
            } else {
                loc = location;
                jobData = jobData
                .filter(item => item.area.short_name === loc);
            }

            career["_job_data"] = jobData[0];
            console.log("Career retrieval complete.");
            res.status(200).send(career);
        } else
            return res
                .status(404)
                .send("Could not locate career. Please try again.");
    } catch (error) {
        console.error(error);
    }
});

module.exports = Router;