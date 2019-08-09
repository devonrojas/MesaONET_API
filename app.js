const PORT = process.env.PORT || 7000;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_URI = "https://maps.googleapis.com/maps/api/geocode/json?address=";

const express = require('express');
const cors = require('cors');
const app = express();

const rp = require("request-promise");

const fs = require('fs');
const access = fs.createWriteStream(__dirname + "/logs/" + new Date().toLocaleDateString().replace(/\//g, "") +".log", {flags: 'a'});

const db = require("./helpers/db.js");
const throttle = require("./helpers/throttle.js");

const Program = require('./helpers/main');
const JobTracker = require('./helpers/job_tracker');
const CareerOneStop = require("./services/CareerOneStopService.js");

const ACADEMIC_PROGRAM_DATA = require('./academic_programs.json');

const whitelist = ["https://peaceful-taiga-34406.herokuapp.com", "https://infinite-spire-51367.herokuapp.com"]
const corsOptions = {
    origin: (origin, cb) => {
        console.log(origin);
        if(whitelist.indexOf(origin) !== -1) {
            cb(null, true);
        } else {
            cb(new Error("Not allowed by CORS"));
        }
    }
}

const logger = (req, res, next) => {
    let m;

    // if(err) {
    //     m = "Server encountered an error: " + err.stack;
    //     res.status(500).send({error: "Server failure."});
    // } else {
    // }
    m = "[" + new Date().toLocaleString() + "]" + " Request received on: " + req.path;

    console.log("\n" + "*".repeat(m.length))
    console.log(m);
    console.log("*".repeat(m.length) + "\n")

    access.write(m + "\n");
    next();
}

app.use(cors());
app.use(logger);

app.get('/', (req, res) => {
    let routes = app._router.stack
    .filter(layer => {
        return layer.route != undefined;
    })
    .map(layer => layer.route.path)
    .join('<br>');
    res.send('Available routes for this program:<br>' + routes);
})

app.get('/program/:code', (req, res) => {
    let code = req.params.code;
    let data = ACADEMIC_PROGRAM_DATA.find(x => x.code == code);

    res.setHeader("Access-Control-Allow-Origin", "*");
    if(data) {
        res.status(200).send(data);
    } else {
        res.status(400).send("Not a valid program code. Please try again.");
    }
})

app.get('/career/:code/:location/:radius', async(req, res) => {
    let code = req.params.code ? req.params.code : res.status(400).send("Please provide an ONET Code.");
    let location = req.params.location ? req.params.location : res.status(400).send("Please provide a location ('US', 'CA', '92111', 'San Diego', etc.");
    let radius = req.params.radius ? req.params.radius : res.status(400).send("Please specify a radius.");

    res.setHeader("Access-Control-Allow-Origin", "*");

    let match;
    console.log("Searching for career...")
    ACADEMIC_PROGRAM_DATA.forEach(program => {
        let c = program.careers.find(career => career.code == code);
        if(c) {
            match = c;
            return;
        }
    })
    if(match) {
        console.log("Career found!")

        let growth = match.growth;
        let title = match.title;

        let technical_skills = await Program.getCareerTechnicalSkills(code);

        let related = ACADEMIC_PROGRAM_DATA
        .filter(x => x.careers
            .some(career => career.code == code))
        .map(x => {
            let path = "/" + x.title.toLowerCase().replace("and ", "").replace(/['\/]|/g, "").replace(/ /g, "-") + ".shtml";
            return {
                title: x.title,
                path: path,
                degree_types: x.degree_types
            }
        })

        let d = await CareerOneStop.fetch(code, title, growth, location, radius);
        d['technical_skills'] = technical_skills;
        d['related_programs'] = related;

        let url = GOOGLE_MAPS_URI + location + "&key=" + GOOGLE_MAPS_API_KEY;
        let options = {
            json: true
        }

        let local = (await rp(url, options)).results[0].address_components;
        
        location = local
        .filter(c => 
            (c.types.includes("postal_code") || 
             c.types.includes("administrative_area_level_2") || 
             c.types.includes("administrative_area_level_1"))
        )
        .map(c => {
            let a = c.types[0];
            a = (a == "postal_code") ? "zip" : 
                (a == "administrative_area_level_2") ? "county" : 
                (a = "adminstrative_area_level_1") ? "state" : null;

            let obj = {};
            obj[a] = c.short_name;
            return obj;
        })
        .reduce((res, cur) => {
            return Object.assign(res, cur);
        }, {});

        let query = {
            "careercode": code,
            "jobcount.area": { $in: Object.values(location) }
        }

        let jobs = await db.queryCollection("job_tracking", query); // Query database with career code & area

        if(jobs && jobs.length > 0) {
            console.log("=".repeat(20))
            console.log("No location data exists for " + code);
            console.log("=".repeat(20))
            c = await JobTracker.pullData(jobs[0], code, location);
            console.log("=".repeat(20))
            console.log("Updating " + code + " with \n" + JSON.stringify(location, undefined, 2) + "\ndata");
            console.log("=".repeat(20))
            console.log("Updating database...");
            await db.addToCollection("job_tracking", c.career);
        } else { // Location doesn't exist in database
            jobs = await db.queryCollection("job_tracking", { "careercode": code }); // Try query with just career code
            if(jobs && jobs.length > 0) {
                console.log("=".repeat(20))
                console.log("No location data exists for " + code);
                console.log("=".repeat(20))
                c = await JobTracker.pullData(jobs[0], code, location);
                console.log("=".repeat(20))
                console.log("Updating " + code + " with \n" + JSON.stringify(location, undefined, 2) + "\ndata");
                console.log("=".repeat(20))
                console.log("Updating database...");
                await db.addToCollection("job_tracking", c.career);
            } else { // No sort of data exists for career
                console.log("=".repeat(20))
                console.log("No data exists for " + code);
                console.log("=".repeat(20))
                c = await JobTracker.pullData(null, code, location);
                console.log("Adding " + code + " to database...");
                await db.addToCollection("job_tracking", c.career);
                jobs[0] = c.career;
            }
        }

        if(jobs[0].hasOwnProperty("jobcount")) {
            d['jobcount'] = jobs[0].jobcount;
        }

        console.log("Career retrieval complete.")
        res.status(200).send(d);

    }
    else return res.status(400).send("Could not locate career. Please try again.");
})

app.get('/generate', async(req, res) => {
    res.status(200).send("Request received.");

    let careers = ACADEMIC_PROGRAM_DATA.map(program => program.careers.map(career => career.code));
    let merged = [].concat.apply([], careers).sort();
    let data = [...new Set(merged)].slice(0, 10); // Remove all duplicate career codes

    let manual = [
        '11-9199.11',
        '15-2091.00',
        '17-2199.01',
        '17-2199.09',
        '17-3027.01',
        '17-3029.11',
        '17-3029.12',
        '19-2041.03',
        '29-1199.04',
        '43-4021.00',
        '47-2142.00'
    ]

    let dbCalls = [];
    let calls = [];

    let start = Date.now();

    console.log();

    dbQueries = data.map(item => {
        return {
            careercode: item
        }
    })

    let results = await db.queryMultiple("job_tracking", dbQueries);

    await asyncForEach(data, async(career, idx) => {

        calls.push(async(cb) => {
            try {
                process.stdout.write("[" + (idx + 1) + "/" + (data.length) + "] ");
                process.stdout.write("Pulling data for career " + career + "\n");
                let c = await JobTracker.pullData(null, career, "92111");
                if(c) {
                    if(c.retry) {
                        cb(c.career.careercode);
                    } else {
                        cb(c.career);
                    }
                }
            } catch(error) {
                process.stdout.write("\n");
                console.log(error);
                cb();
            }
        });
    })

    let arr = await throttle(calls, 10, 1000);
    let errored = arr.filter(item => typeof item == "string");
    arr = arr.filter(item => typeof item == "object");

    dbCalls = errored.map(item => {
        return {
            careercode: item
        }
    })

    results = await db.queryMultiple("job_tracking", dbCalls);
    
    if(errored.length > 0) {
        let retryCalls = [];

        console.log("Careers with errors:")
        await asyncForEach(errored, (career, idx) => {
            console.log("\t" + career);
            retryCalls.push(async(cb) => {
                try {
                    process.stdout.write("[" + (idx + 1) + "/" + (errored.length) + "] ");
                    process.stdout.write("Pulling data for career " + career + "\n");
                    let c = await JobTracker.pullData(null, career, "92111");
                    if(c) {
                        cb(c.career);
                    }
                } catch(error) {
                    process.stdout.write("\n");
                    console.log(error);
                    cb();
                }
            });
        })
    
        let retried = await throttle(retryCalls, 5, 1000);
        retried = retried.filter(item => typeof item == 'object');

        arr = arr.concat(retried);
    }

    await db.addMultipleToCollection("job_tracking", arr);
    let end = Date.now();
    let duration = (end - start) / 1000;
    let t = " seconds";

    if(duration > 60) {
        duration = (duration / 60).toFixed(2);
        t = " minutes";
    }

    console.log("Complete. Total time elapsed: " + duration + t);
})

app.listen(PORT, () => console.log(`App running on port: ${PORT}.`))

// Helper functions
const asyncForEach = async(arr, cb) => {
    for(let i = 0; i < arr.length; i++) {
        await cb(arr[i], i, arr);
    }
}