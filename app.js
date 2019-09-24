/**
 * @module CareerEducationAPI
 * @author Devon Rojas
 * 
 * @requires {@link https://www.npmjs.com/package/express| express}
 * @requires {@link https://www.npmjs.com/package/cors| cors}
 * @requires {@link https://nodejs.org/api/fs.html| fs}
 * @requires {@link https://www.npmjs.com/package/body-parser| body-parser}
 * 
 * @requires routes/program
 * @requires routes/career
 * @requires routes/admin
 */

require("dotenv").config();
const PORT = process.env.PORT || 7000;

// Package imports
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const db = require("./services/DatabaseService.js");

// Keep server alive
const http = require("http");
setInterval(function() {
    http.get("http://infinite-spire-51367.herokuapp.com");
}, 300000);

// Express Routers
const programRoutes = require("./routes/program.js");
const careerRoutes = require("./routes/career.js");
const adminRoutes = require("./routes/admin.js");

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
 * express module
 * @type {object}
 * @const
 * @namespace app
 */
const app = express();

const corsOptions = {
    origin: ['http://localhost:5500/', 'https://peaceful-taiga-34406.herokuapp.com/'],
    methods: ['GET', 'POST']
}

// Request Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(logger);

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
})

// Routing middleware
/**
 * Defines available /program routes
 * @memberof module:CareerEducationAPI~app
 */
app.use("/program", programRoutes);
/**
 * Defines available /career routes
 * @memberof module:CareerEducationAPI~app
 */
app.use("/career", careerRoutes);
/**
 * Defines available /admin routes
 * @memberof module:CareerEducationAPI~app
 */
app.use("/admin", adminRoutes);

/**
 * Lists all routes available on API.
 * 
 * @name GET/
 * @function
 * @memberof module:CareerEducationAPI~app
 */
app.get("/", (req, res) => {
    let routes = [programRoutes].concat(careerRoutes, adminRoutes).map(router => {
        return router.stack.filter(layer => {
            return layer.route != undefined;
        })
        .map(layer => layer.route.path)
    })
    routes = [].concat.apply([], routes).reduce((str, route) => {
        str += route + "\n";
        return str;
    }, "");
    res.send("Available routes for this program:\n" + routes);
});

/**
 * Loads application documentation pages.
 * 
 * @name GET/docs
 * @function
 * @memberof module:CareerEducationAPI~app
 */
app.use("/docs", express.static("out"));

// ADMINISTRATIVE ENDPOINTS
app.post("/password", async(req, res) => {
    try {
        res.status(201).send("Processing...");

        await bcrypt.hash(pass, 10, async(err, hash) => {
            req.body.password = hash;
            const writeOp = (user) => {
                return [
                    {"username": user.username},
                    user,
                    {upsert: true}
                ]
            }
            await db.addToCollection("auth_users", req.body, writeOp);
            console.log("completed");
        })
    } catch(error) {
        console.error(error);
    }
})
app.post("/kill", async(req, res) =>{
    if(req.body && req.body.password && req.body.username) {
        let hash = await db.queryCollection("auth_users", {"username": req.body.username});
        if(hash.length > 0) {
            hash = hash[0].password;

            await bcrypt.compare(req.body.password, hash, (err, success) => {
                if(success) {
                    res.status(201).send("SUCCESS. SHUTTING DOWN SERVER...");
                    shutDown();
                } else {
                    res.status(404).send("SERVER SHUTDOWN FAILED.");
                }
            })
        } else {
            res.status(404).send("SERVER SHUTDOWN FAILED.");
        }
    } else {
        res.status(404).send("WARNING: YOU ARE ATTEMPTING TO KILL THE SERVER. PLEASE RESEND REQUEST WITH THE PROPER PAYLOAD TO EXECUTE SERVER SHUTDOWN.");
    }
})

// Instantiates Express application on specified PORT
const server = app.listen(PORT, () => console.log(`App running on port: ${PORT}.`));

let connections = [];

const shutDown = () => {
    const skull = "\n                 uuuuuuu\n             uu$$$$$$$$$$$uu\n          uu$$$$$$$$$$$$$$$$$uu\n         u$$$$$$$$$$$$$$$$$$$$$u\n        u$$$$$$$$$$$$$$$$$$$$$$$u\n       u$$$$$$$$$$$$$$$$$$$$$$$$$u\n       u$$$$$$$$$$$$$$$$$$$$$$$$$u\n       u$$$$$$\"   \"$$$\"   \"$$$$$$u\n       \"$$$$\"      u$u       $$$$\"\n        $$$u       u$u       u$$$\n        $$$u      u$$$u      u$$$\n         \"$$$$uu$$$   $$$uu$$$$\"\n          \"$$$$$$$\"   \"$$$$$$$\"\n            u$$$$$$$u$$$$$$$u\n             u$\"$\"$\"$\"$\"$\"$u\n  uuu        $$u$ $ $ $ $u$$       uuu\n u$$$$        $$$$$u$u$u$$$       u$$$$\n  $$$$$uu      \"$$$$$$$$$\"     uu$$$$$$\nu$$$$$$$$$$$uu    \"\"\"\"\"    uuuu$$$$$$$$$$\n$$$$\"\"\"$$$$$$$$$$uuu   uu$$$$$$$$$\"\"\"$$$\"\n \"\"\"      \"\"$$$$$$$$$$$uu \"\"$\"\"\"\n           uuuu \"\"$$$$$$$$$$uuu\n  u$$$uuu$$$$$$$$$uu \"\"$$$$$$$$$$$uuu$$$\n  $$$$$$$$$$\"\"\"\"           \"\"$$$$$$$$$$$\"\n   \"$$$$$\"                      \"\"$$$$\"\"\n     $$$\"                         $$$$\"\n";
    let indentedSkull = "";
    skull.split("\n").forEach(line => {
        indentedSkull += "\t" + line + "\n";
    })
    console.log(indentedSkull);
    console.log("Received kill signal, attempting to shut down gracefully...");

    server.close(() => {
        console.log("Closed out remaining connections");
        process.exit(0);
    })

    setTimeout(() => {
        console.log("Could not close connections in time, forcefully shutting down!");
        process.exit(1);
    }, 1000 * 10);

    connections.forEach(curr => curr.end());
    setTimeout(() => connections.forEach(curr => curr.destroy()), 5000);
}

process.on("SIGTERM", shutDown);
process.on("SIGINT", shutDown);

server.on('connection', connection => {
    connections.push(connection);
    connection.on('close', () => connections = connections.filter(curr => curr !== connection));
})
