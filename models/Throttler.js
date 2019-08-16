const ONETService = require("../services/ONETService.js");
const GROWTH_DATA = require("../bls_projected_occupational_growth_2016-2026.json");

const Career = require("./Career.js");
const Salary = require("./Salary.js");

const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const asyncForEach = async(arr, cb) => {
    for(let i = 0; i < arr.length; i++) {
        await cb(arr[i], i, arr);
    }
}

var requests = 0;

/**
 * 
 * @param {Array}  calls            Callbacks to throttle
 * @param {number} rateLimitCount   Amount of allowed synchronous call executions
 * @param {number} rateLimitTime    Delay between execution groups
 */
const throttle = async(calls, rateLimitCount, rateLimitTime) => {
    const totalCalls = calls.length;
    console.log(`Total calls: ${totalCalls}`);
    let p = [];
    while(calls.length > 0) {
        let callstoExecute = calls.slice(0, rateLimitCount);
        calls = calls.slice(rateLimitCount, calls.length);

        let promises = [];
        callstoExecute.forEach((call) => promises.push(new Promise((resolve, reject) => call(resolve))));

        let res = await Promise.all(promises);
        p = p.concat(res);
        await timeout(rateLimitTime);
    }
    return p;
}

/**
 * @class
 */
class Throttler {
    /**
     * Initializes class members.
     * 
     * @param {Array}       arr             Iterable list of items
     * @param {number=1}    rateLimitCount  Amount of allowed sychronous calls
     * @param {number=1000} rateLimitTime   Delay between call groups
     */
    constructor(arr = [], rateLimitCount = 1, rateLimitTime = 1000, startingCode = 0) {
        this.arr = arr;
        this.rateLimitCount = rateLimitCount;
        this.rateLimitTime = rateLimitTime;
        this.startingCode = startingCode;
    }

    /**
     * Runs O*NET data collection logic.
     * 
     * @async
     * 
     * @return {Array} Collection of responses from callback functions
     */
    async execute() {
        let calls = [];
        let startTime = Date.now();
        
        await asyncForEach(this.arr, async(program) => {
            console.log("Program: " + program.title);

            // Get all matching occupations for program name
            const keyword_url = "https://services.onetcenter.org/ws/online/search?keyword=" + program.title.toLowerCase();
            let res = await ONETService.fetch(keyword_url);

            requests+=2;

            let occupation_calls = [];
    
            await asyncForEach(res, async(occupation) => {
                let growth = 
                GROWTH_DATA.find(item => 
                    item.soc_code == (occupation.code
                                        .substring(0, occupation.code.indexOf('.'))));

                growth = growth == undefined ? null : +growth.growth_pct;

                const career_detail_url = "https://services.onetcenter.org/ws/mnm/careers/" + occupation.code + "/report";

                occupation_calls.push(async(cb) => {
                    console.log("Constructing career for " + occupation.title + "...");
                    let salary = await ONETService.fetch(career_detail_url);
                    requests++;
                    if(!salary) {
                        cb();
                    } else {
                        let career = new Career(occupation.code, occupation.title, growth, salary);
                        cb(career);
                    }
                })
            });

            calls.push(async(callback) => {
                // Education Levels
                let msg = "/*** Pulling O*NET occupation data for " + program.title + " ***/";
                console.log();
                console.log(Array(msg.length + 1).join('='));
                console.log(msg);
                console.log(Array(msg.length + 1).join('='));
                console.log();

                let o = await throttle(occupation_calls, this.rateLimitCount, this.rateLimitTime);
                
                let agg_salary_low = 1000000;
                let agg_salary_med = 0;
                let agg_salary_high = 0;
                let aggregate_growth = 0;
                let len = o.length;
                await asyncForEach(o, async(item) => {
                    if(item) {
                        if(item.hasOwnProperty('growth')) {
                            aggregate_growth += item.growth;
                        }

                        if(item.hasOwnProperty('salary')) {
                            if(item.salary != null) {
                                if(agg_salary_low > item.salary.low) {
                                    agg_salary_low = item.salary.low;
                                };
                                agg_salary_med += item.salary.median;
                                if(agg_salary_high < item.salary.high) {
                                    agg_salary_high = item.salary.high;
                                };
                            } else {
                                len--
                            };
                        } else {
                            len--;
                        }
                    } else len--;
                })

                let s = new Salary(agg_salary_low,
                                   agg_salary_med / len,
                                   agg_salary_high);

                aggregate_growth /= len;

                // Build full program here and pass to callback
                let obj = {
                    title: program.title,
                    degree_types: program.degree_types,
                    code: this.startingCode++,
                    careers: o.filter(x => x != null),
                    salary: s,
                    aggregate_growth: aggregate_growth
                }
                callback(obj);
            })
        })
    
        let p = await throttle(calls, this.rateLimitCount, this.rateLimitTime);

        console.log("\n========================================")
        console.log(`\nTotal requests made: ${requests}\n`);
        console.log(`Elapsed time: ` + ((Date.now() - startTime) / 1000) + " seconds");
        
        return p;
    }
}

module.exports = Throttler;