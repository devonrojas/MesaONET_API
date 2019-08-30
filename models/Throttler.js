/**
 * @module models/Throttler
 * @author Devon Rojas
 * 
 * @requires helpers/Utils
 */

const Utils = require("../helpers/utils.js");

/**
 * Class containing logic to throttle a large number of function executions.
 */
class Throttler {
    /**
     * 
     * @param {Array}   arr                     Array of items to perform an operation on
     * @param {number}  [rateLimitCount=1]      Number of executions to perform per rateLimitTime
     * @param {number}  [rateLimitTime=1000]    Amount of time (in milliseconds) to wait between execution batches
     */
    constructor(arr = [], rateLimitCount = 1, rateLimitTime = 1000) {
        /** @private */
        this.arr = arr;
        /** @private */
        this.rateLimitCount = rateLimitCount;
        /** @private */
        this.rateLimitTime = rateLimitTime;
    }

    /**
     * Executes, in batch sizes specified in the {@link module:models/Throttler#constructor|constructor}, a
     * callback function on each item in the Throttler's item array.
     * 
     * @async
     * @see {@link module:helpers/Utils~throttle|Utils.throttle()}
     * 
     * @param {Function} callbackFn An _asynchronous_ callback function to perform on each item - Must handle two arguments, (cb, item), 
     * with cb being a returned function and item being the current item from the array.
     * 
     * @example A sample callbackFn argument.
     * async callbackFn(cb, item) => {
     *      // Perform some operation on item
     *      cb();
     * }
     * 
     * @return {Array} Resulting response array from throttled callback functions.
     */
    async execute(callbackFn) {
        let calls = [];
        let startTime = Date.now();

        await Utils.asyncForEach(this.arr, async(item) => {
            calls.push(async(cb) => callbackFn(cb, item));
        })

        let p = await Utils.throttle(calls, this.rateLimitCount, this.rateLimitTime);
        let endTime = (Date.now() - startTime) / 1000;
        if(endTime > 100) {
            console.log("Elapsed time: " + (endTime / 60) + " minutes.");
        } else {
            console.log("Elapsed time: " + (endTime) + " seconds.");
        }
        return p;
    }
}

module.exports = Throttler;