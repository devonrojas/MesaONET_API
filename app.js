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
const PORT = process.env.PORT || 8000;

// Package imports
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bodyParser = require("body-parser");

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

/**
 * Instantiates Express application on specified PORT
 */
app.listen(PORT, () => console.log(`App running on port: ${PORT}.`));