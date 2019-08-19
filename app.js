/**
 * @module routers/programs
 * @requires express
 */

const PORT = process.env.PORT || 7000;
const GOOGLE_MAPS_API_KEY =
    process.env.GOOGLE_MAPS_API_KEY ||
    "AIzaSyCehU42t2h709gUgFvVdcXF6jFfptxKTbs";
const GOOGLE_MAPS_URI =
    "https://maps.googleapis.com/maps/api/geocode/json?address=";

// Package imports
const express = require("express");
const cors = require("cors");
const rp = require("request-promise");
const fs = require("fs");
const bodyParser = require("body-parser");

// Module imports
const db = require("./helpers/db.js");
const throttle = require("./helpers/throttle.js");
const Program = require("./helpers/main");
const JobTracker = require("./helpers/job_tracker");
const CareerOneStop = require("./services/CareerOneStopService.js");
const DataExportService = require("./services/DataExportService.js");
const Throttler = require("./models/Throttler.js");

const ACADEMIC_PROGRAM_DATA = require("./academic_programs.json");
const access = fs.createWriteStream(
    __dirname +
        "/logs/" +
        new Date().toLocaleDateString().replace(/\//g, "") +
        ".log",
    { flags: "a" }
);

const logger = (req, res, next) => {
    let m;

    m =
        "[" +
        new Date().toLocaleString() +
        "] " +
        req.method +
        " Request received on: " +
        req.path;

    console.log("\n" + "*".repeat(m.length));
    console.log(m);
    console.log("*".repeat(m.length) + "\n");

    access.write(m + "\n");
    next();
};

/**
 * @type {object}
 * @const
 * @namespace careerEdAPI
 */
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(logger);

/**
 * Method: GET
 * Lists all routes available on API.
 * 
 * @name get/
 * @function
 * @memberof module:routers/programs~careerEdAPI
 */
app.get("/", (req, res) => {
    let routes = app._router.stack
        .filter(layer => {
            return layer.route != undefined;
        })
        .map(layer => layer.route.path)
        .join("<br>");
    res.send("Available routes for this program:<br>" + routes);
});


/**
 * Method: POST
 * Adds a new program to database.
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
 * @name post/program
 * @function
 * @memberof module:routers/programs~careerEdAPI
 */
app.post("/program", async (req, res) => {
    res.setHeader("Allow-Access-Control-Origin", "*");
    const keys = [
        {
            name: "title",
            type: {
                name: "string",
                fn: isString
            }
        },
        {
            name: "degree_types",
            type: {
                name: "Array",
                fn: isArray
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
            let currentProgramLength = (await db.queryCollection(
                "academic_programs",
                {}
            )).length;
            const throttler = new Throttler(
                [data],
                5,
                500,
                currentProgramLength
            );

            // Retrieve career info for program
            console.log("Pulling O*NET data...");
            let p = (await throttler.execute())[0];

            // Add to academic_programs collection in database
            let writeOperation = (data) => {
                return [
                    { code: data["code"] },
                    {
                        code: data["code"],
                        title: data["title"],
                        degree_types: data["degree_types"],
                        careers: data["careers"],
                        salary: data["salary"],
                        aggregate_growth: data["aggregate_growth"]
                    },
                    { upsert: true }
                ];
            };
            await db.addToCollection("academic_programs", p, writeOperation);

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
                    await asyncForEach(newCareers, async (career, idx) => {
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

                    let arr = await throttle(calls, 10, 1000);
                    let errored = arr.filter(item => typeof item == "string");
                    arr = arr.filter(item => typeof item == "object");

                    // Run any errored careers again
                    if (errored.length > 0) {

                        let retryCalls = [];

                        console.log("Careers with errors:");
                        await asyncForEach(errored, (career, idx) => {
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

                        let retried = await throttle(retryCalls, 5, 1000);
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
                    
                    await asyncForEach(CLEANED_DATA, async(item, index) => {
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
 * Method: GET
 * Retrieves program information associated with program code.
 * 
 * @name get/program/:code
 * @function
 * @memberof module:routers/programs~careerEdAPI
 * 
 * @param {number} code Program code to look up
 */
app.get("/program/:code", (req, res) => {
    let code = req.params.code;
    let data = ACADEMIC_PROGRAM_DATA.find(x => x.code == code);

    res.setHeader("Access-Control-Allow-Origin", "*");
    if (data) {
        res.status(200).send(data);
    } else {
        res.status(400).send("Not a valid program code. Please try again.");
    }
});

/**
 * Method: GET
 * Retreives occupation information associated with a program
 * code, location, and radius.
 * 
 * @name get/career/:code/:location/:radius
 * @function
 * @memberof module:routers/programs~careerEdAPI
 *
 * @param {string} code     Occupation code to look up
 * @param {string} location Location to retrieve occupation data around
 * @param {number} radius   Distance from location to search
 */
app.get("/career/:code/:location/:radius", async (req, res) => {
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

app.get("/export-careers", async (req, res) => {
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

app.get("/export-programs", async (req, res) => {
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

/**
 * Method: GET
 * Pulls new program and occupation data
 * 
 * @name get/generate
 * @function
 * @memberof module:routers/programs~careerEdAPI
 */
app.get("/generate", async (req, res) => {
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

app.listen(PORT, () => console.log(`App running on port: ${PORT}.`));



// Helper functions

const asyncForEach = async (arr, cb) => {
    for (let i = 0; i < arr.length; i++) {
        await cb(arr[i], i, arr);
    }
};

const isString = val => {
    return typeof val === "string";
};

const isArray = val => {
    return Array.isArray(val);
};
