/**
 * @module helpers/Utils
 * @author Devon Rojas
 */

const readline = require("readline");

/**
 * Class containing utility functions for application.
 */
class Utils {
    constructor() {}

    /**
     * Checks if a value is a string.
     * 
     * @param {*} val 
     * @return {boolean} Whether or not the value is a string.
     */
    static isString(val) {
        return typeof val === "string";
    };
    
    /**
     * Checks if a value is an array.
     * 
     * @param {*} val 
     * @return {boolean} Whether or not the value is an array.
     */
    static isArray(val) {
        return Array.isArray(val);
    };

    /**
     * Checks if data is null or contains any null values.
     * 
     * @param {*} data Data to check nullity for.
     * 
     * @return {boolean} Whether or not the data has any null values.
     */
    static isNull(data) {
        if(data instanceof Array) {
            return !data.every(item => {
                return !Object.values(item).every(val => val !== null && val !== undefined);
            })
        } else if(data instanceof Object) {
            return !Object.values(data).every(item => item !== null && item !== undefined);
        } else {
            return typeof data == null;
        }
    }

    /**
     * Sets a timeout.
     * 
     * @param {number} ms   Amount of time in milliseconds to wait. 
     * @return {Promise}    A completed Promise after timeout finishes.
     */
    static timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Asynchronously loops through an array, executing a callback function
     * for each element contained within array.
     * 
     * @async
     * @param {Array}     arr   Array to asynchronously loop through
     * @param {Function}  cb    Callback function to execute for each array element.
     */
    static async asyncForEach(arr, cb){
        for (let i = 0; i < arr.length; i++) {
            await cb(arr[i], i, arr);
        }
    };

    /**
     * Asynchronously executes callback functions per the rateLimitCount and rateLimitTime
     * values passed in to the function.
     * 
     * @async
     * @param {Array}   calls           Array of calls to execute
     * @param {number}  rateLimitCount  Amount of calls to make sychronously
     * @param {number}  rateLimitTime   Amount of time to wait between batches
     */
    static async throttle(calls, rateLimitCount, rateLimitTime) {
        const totalCalls = calls.length;
        console.log(`Total calls: ${totalCalls}`);
        let p = [];
        while(calls.length > 0) {
            var twirlTimer = (function() {
                var P = ["\\", "|", "/", "-"];
                var x = 0;
                return setInterval(function() {
                  process.stdout.write("\r" + P[x++] + " Calls left to execute: " + calls.length + "...");
                  x &= 3;
                }, 250);
              })();

            let callstoExecute = calls.slice(0, rateLimitCount);
            calls = calls.slice(rateLimitCount, calls.length);
    
            let promises = [];
            callstoExecute.forEach((call) => promises.push(new Promise((resolve, reject) => call(resolve))));
    
            let res = await Promise.all(promises);
            p = p.concat(res);
            await Utils.timeout(rateLimitTime);

            // Return stdout to beginning of line
            clearInterval(twirlTimer);
            process.stdout.write("\r");
        }
        return p;
    }
}

module.exports = Utils;