/**
 * @file 
 * @module models/AcademicProgram
 * @author Devon Rojas
 * 
 * @requires services/ONETService
 * @requires services/DatabaseService
 * @requires models/Career
 * @requires models/Salary
 */

const ONETService = require("../services/ONETService.js");
const db = require("../services/DatabaseService.js");
const Career = require("./Career.js");
const Salary = require("./Salary.js");
const Utils = require("../helpers/utils.js");

/**
 * Class representing an academic program at Mesa and all associated O*NET
 * Career data under it.
 */
class AcademicProgram {
    /**
     * Creates an academic program.
     * @param {string} title                The name of the program.
     * @param {Array}  [degree_types=[]]    The types of degrees or certifications offered under the program.
     * @param {number} [code=0]             A program code
     */
    constructor(title, code, degree_types = [], relevance_score = 50, soc_blacklist = [], soc_adds = [], keyword = "") {
        /** @private */
        this._title = title;
        /** @private */
        this._code = code ? code : 0;
        /** @private */
        this._careers = [];
        /** @private */
        this._degree_types = degree_types;
        /** @private */
        this._aggregate_salary = [];
        /** @private */
        this._aggregate_growth = 0;
        /** @private */
        this._relevance_score = relevance_score;
        /** @private */
        this._soc_blacklist = soc_blacklist;
        /** @private */
        this._soc_adds = soc_adds.map(code => {
            return {
                code: code,
                title: "N/A"
            }
        });
        /** @private */
        this._keyword = keyword;
    }

    async addCareer(career) {
        if(!this._careers.map(career => career._code).includes(career._code)) {
            this._careers.push(career);
            await this._aggregateData();
        } else {
            console.log("Career " + career._title + " already exists in program.");
        }
    }

    async removeCareer(code) {
        if(this._careers.map(career => career._code).includes(code)) {
            let idx = this._careers.map(career => career._code).indexOf(code);
            this._careers.splice(idx, 1);
            await this._aggregateData();
        } else {
            console.log("Career " + code + " already exists in program.");
        }
    }
    
    hasCareer(code) {
        return this._careers.map(career => career._code).includes(code);
    }

    /**
     * Checks database for existing program data, and if it doesn't exist, builds
     * Careers out of all O*NET Occupations associated with the program. Each career has their
     * related programs updated as it is generated. If program data _does_ exist, the
     * data is copied into the AcademicProgram object, and the contained careers are
     * scanned for any related programs updates.
     * 
     * @async
     * @see {@link module:models/Career|Career}
     * @see {@link module:services/ONETService|ONETService}
     * @see {@link module:services/DatabaseService|DatabaseService}
     * 
     * @return {void}
     */
    async retrieveAcademicProgramData() {
        try {
            // Check if program data has already been generated. If it has, just return 
            // it instead of re-generating the program and career data.
            let existingProgram = await db.queryCollection("programs", { _title: this._title });
            if(existingProgram.length === 0) {
                console.log("\nBuilding program: " + this._title + "\n");

                // Get length of collection for next code in series
                let docs = await db.queryCollection("programs", {});
                this._code = docs.length + 1;
                // Get all matching occupations for program name
                const keyword_url = "https://services.onetcenter.org/ws/online/search?keyword=" + this._keyword;
                let res = await ONETService.fetch(keyword_url, this._relevance_score);
                if(this._soc_adds.length > 0) {
                    res = res.concat(this._soc_adds);
                }
                await Utils.asyncForEach(res, async(career, index) => {
                    console.log("[" + (index + 1) + "/" + res.length + "] " + "Checking " + career.code + " | " + career.title + "...\r");
                    // Check for blacklisted codes
                    let codePrefix = career.code.slice(0, 2);
                    if(!this._soc_blacklist.includes(codePrefix)) {
                        // Build Career objects for all valid O*NET Codes
                        let c = new Career(career.code);
                        c.setRelatedPrograms(await this._buildRelatedProgramData(c._code));
                        await c.retrieveCareerData();
        
                        if(c.hasOwnProperty("_salary")) {
                            // Only save career growth and salary info in program data
                            let obj = {
                                _code: c._code,
                                _title: c._title,
                                _growth: c._growth,
                                _salary: c._salary["NationalWagesList"][0]
                            }
                            this._careers.push(obj)
                        }
                    } else {
                        console.log("Skipping " + career.code + ". Blacklisted.");
                    }
                })
            } else {
                console.log("\nProgram: " + this._title + " already exists in database.");
                console.log("Checking if related programs have been updated...\n");
                Object.assign(this, existingProgram[0]);

                // Run through all careers in program to check for updates
                await Utils.asyncForEach(this._careers, async(career, index) => {
                    let c = Object.assign(new Career(career["_code"]), career);

                    let obj = {
                        _code: c._code,
                        _title: c._title,
                        _growth: c._growth,
                        _salary: c._salary
                    }

                    // Update career in program object
                    this._careers[index] = obj;
                })

                await this.checkRelatedPrograms();
                
                console.log();
            }

            // Filter any null data before aggregation
            this._careers = this._careers.filter(career => career._salary !== null && career._salary !== undefined)
            // Aggregate salary and growth data from careers
            await this._aggregateData();

            // Remove extraneous properties
            delete this._soc_blacklist;
            delete this._soc_adds;
            delete this._keyword;
            delete this._relevance_score;

            // Update program in database
            let writeOp = (program) => {
                return [
                    { _code: program['_code'] },
                    Object.assign({}, {...program, lastUpdated: Date.now()}),
                    { upsert: true }
                ]
            }
            await db.addToCollection("programs", this, writeOp);

        } catch(error) {
            console.error(error.message);
            console.error(error.fileName + " | " + error.lineNumber + " | " + error.columnNumber)
        }
    }

    async checkRelatedPrograms() {
        await Utils.asyncForEach(this._careers, async(career, index) => {
            console.log("[" + (index + 1) + "/" + this._careers.length + "] " + "Checking " + career._code + " | " + career._title + "...\r");
            career = (await db.queryCollection("careers", {"_code": career._code}))[0];
            let c = Object.assign(new Career(), career);
            await c.setRelatedPrograms(await this._buildRelatedProgramData(c._code));
            await c.saveToDatabase();
        })
    }

    async updateCareers() {
        this._careers = [];
        // Get all matching occupations for program name
        const keyword_url = "https://services.onetcenter.org/ws/online/search?keyword=" + this._title.toLowerCase();
        let res = await ONETService.fetch(keyword_url);
        await Utils.asyncForEach(res, async(career, index) => {
            console.log("[" + (index + 1) + "/" + res.length + "] " + "Checking " + career.code + " | " + career.title + "...\r");
            // Build Career objects for all valid O*NET Codes
            let c = new Career(career.code);
            c.setRelatedPrograms(await this._buildRelatedProgramData(c._code));
            await c.retrieveCareerData();
            if(c.hasOwnProperty("_salary")) {
                // Only save career growth and salary info in program data
                let obj = {
                    _code: c._code,
                    _title: c._title,
                    _growth: c._growth,
                    _salary: c._salary["NationalWagesList"][0]
                }
                this._careers.push(obj);
            }
        })
        
        // Filter any null data before aggregation
        this._careers = this._careers.filter(career => career._salary !== null && career._salary !== undefined);
        // Aggregate salary and growth data from careers
        await this._aggregateData();
    }

    /**
     * Aggregates all salary and growth values in careers array and stores
     * results in _aggregate_salary and _aggregate_growth properties.
     * 
     * @async
     * @private
     * 
     * @return {void}
     */
    async _aggregateData() {
        try {
            let temp = [];
            // Map all careers to just national salary data and push each salary object into _aggregate_salary array.
            this._careers
            .map(career => career._salary)
            .forEach(salary => {
                temp.push(new Salary(...Object.values(salary)));
            })
            // Reduce salary objects in array to single values.
            let o = temp.reduce((obj, item) => {
                obj.Pct10 += item.getPct10(),
                obj.Pct25 += item.getPct25(),
                obj.Median += item.getMedian(),
                obj.Pct75 += item.getPct75(),
                obj.Pct90 += item.getPct90()
                return obj;
            }, {Pct10: 0, Pct25: 0, Median: 0, Pct75: 0, Pct90: 0});
            // Average the salary data using the length of the _careers array
            Object.keys(o).forEach(key => {
                o[key] /= this._careers.length;
            })
            this._aggregate_salary = o;
    
            // Map all careers to just growth data and accumulate total in _aggregate_growth property
            this._careers.map(career => career._growth).forEach(growth => {
                if(isNaN(growth)) {
                    this._aggregate_growth += +growth;
                } else {
                    this._aggregate_growth += growth;
                }
            })
            // Average the growth using the length of the _careers array
            this._aggregate_growth /= this._careers.length;
        } catch(error) {
            console.error(error);
        }
    }

    /**
     * Scans database to find all programs containing a specific O*NET Occupation code
     * and maps those programs into an array of related programs containing the program
     * title, degree types, and URL path to the Mesa academic program pages.
     * 
     * @async
     * @private
     * @see {@link modules:services/DatabaseService|DatabaseService}
     * 
     * @return {void}
     */
    async _buildRelatedProgramData(code) {
        // Find all programs that have career code in _careers array.
        let relatedPrograms = await db.queryCollection("programs", { "_careers._code": code, "_title": { $ne: this._title } });
        // Include current program in related programs
        relatedPrograms.push(this);

        // Map all programs into related program format
        relatedPrograms = relatedPrograms.map(program => {
            let path =
            "/" +
            program._title
                .toLowerCase()
                .replace("and ", "")
                .replace(/['\/]|/g, "")
                .replace(/ /g, "-") +
            ".shtml";

            return {
                title: program._title,
                code: program._code,
                degree_types: program._degree_types,
                path: path
            }
        })
        // Return alphabetically sorted list
        return relatedPrograms.sort((a, b) => {
            return a.title > b.title;
        });
    }
}

module.exports = AcademicProgram;