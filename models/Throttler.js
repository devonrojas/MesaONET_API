const Utils = require("../helpers/utils.js");
const JobTracker = require('./JobTracker.js');

class Throttler {
    constructor(arr = [], rateLimitCount = 1, rateLimitTime = 1000) {
        this.arr = arr;
        this.rateLimitCount = rateLimitCount;
        this.rateLimitTime = rateLimitTime;
    }

    async execute() {
        let calls = [];
        let startTime = Date.now();

        await Utils.asyncForEach(this.arr, async(code) => {
            calls.push(async(cb) => {
                let j = new JobTracker(code);
                await j.retrieveData();
                cb(j);
            })
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