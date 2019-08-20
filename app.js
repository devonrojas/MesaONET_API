/**
 * @module careerEdAPI
 * @requires express
 */

const PORT = process.env.PORT || 7000;

// Package imports
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bodyParser = require("body-parser");

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
 * @type {object}
 * @const
 * @namespace main
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
app.use("/program", programRoutes);
app.use("/career", careerRoutes);
app.use("/admin", adminRoutes);

/**
 * Method: GET
 * Lists all routes available on API.
 * 
 * @name get/
 * @function
 * @memberof module:careerEdAPI~main
 */
app.get("/", (req, res) => {
    let routes = [programRoutes, careerRoutes, adminRoutes].map(router => {
        return router.stack.filter(layer => {
            return layer.route != undefined;
        })
        .map(layer => layer.route.path)
        .join("<br>");
    })
    res.send("Available routes for this program:<br>" + routes);
});

app.listen(PORT, () => console.log(`App running on port: ${PORT}.`));

// Helper functions