/**
 * @module helpers/auth
 * @author Devon Rojas
 * 
 * @requires {@link https://www.npmjs.com/package/bcrypt|bcrypt}
 * 
 * @requires services/DatabaseService
 */

// Package imports
const bcrypt = require("bcrypt");
const db = require("../services/DatabaseService");

/**
 * Authenticates an admin user
 * 
 * @name authenticate
 * @memberof modules:helpers/auth
 * @function
 */
const authenticate = async(req, res, next) => {
    if(req.get("Mesa-API")) {
        let api = Buffer.from(req.get("Mesa-API")).toString('base64');
        let admin = await db.queryCollection("auth_users", {"username": "admin"}); // Hard coded in for now
        let hash = admin[0].password;
        
        await bcrypt.compare(api, hash, (err, success) => {
            if(success) {
                next();
            } else {
                res.status(401).send("Invalid credentials.")
            }
        })
    } else {
        res.status(401).send("Required header not present on resource.");
    }
}

module.exports = authenticate;