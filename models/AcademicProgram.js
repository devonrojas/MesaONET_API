/**
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
     */
    constructor(title, degree_types = []) {
        /** @private */
        this._title = title;
        /** @private */
        this._code = 0;
        /** @private */
        this._careers = [];
        /** @private */
        this._degree_types = degree_types;
        /** @private */
        this._aggregate_salary = [];
        /** @private */
        this._aggregate_growth = 0;
    }

    /**
     * Checks database for existing program data, and if it doesn't exist, builds
     * Careers out of all O*NET Occupations associated with the program. Each career has their
     * related programs updated as it is generated. If program data _does_ exist, the
     * data is copied into the AcademicProgram object, and the contained careers are
     * scanned for any related programs updates.
     * 
     * @async
     * @see [Career]            {@link module:models/Career}
     * @see [ONETService]       {@link module:services/ONETService}
     * @see [DatabaseService]   {@link module:services/DatabaseService}
     * 
     * @return {void}
     */
    async retrieveAcademicProgramData() {
        try {
            // Check if program data has already been generated. If it has, just return 
            // it instead of re-generating the program and career data.
            let existingProgram = await db.queryCollection("programs", { _title: this._title });
            if(existingProgram.length === 0) {
                // Get length of collection for next code in series
                let docs = await db.queryCollection("programs", {});
                this._code = docs.length + 1;
                // Get all matching occupations for program name
                const keyword_url = "https://services.onetcenter.org/ws/online/search?keyword=" + this._title.toLowerCase();
                let res = await ONETService.fetch(keyword_url);
                await Utils.asyncForEach(res, async(career) => {
                    // Build Career objects for all valid O*NET Codes
                    let c = new Career(career.code);
                    await c.retrieveCareerData();
                    c.setRelatedPrograms(await this._buildRelatedProgramData(c._code));
        
                    // Append career to careers array
                    let valid = await c.validateCareer();
                    if(valid) {
                        this._careers.push(c)
                    };
                })
            } else {
                console.log("\nProgram: " + this._title + " already exists in database.");
                console.log("Checking if related programs have been updated...\n");
                Object.assign(this, existingProgram[0]);

                // Run through all careers in program to check for updates
                await Utils.asyncForEach(this._careers, async(career, index) => {
                    console.log("[" + (index + 1) + "/" + existingProgram[0]._careers.length + "] " + "Checking " + career._code + " | " + career._title + "...");
                    let c = Object.assign(new Career(), career);
                    c.setRelatedPrograms(await this._buildRelatedProgramData(c._code));
                    // Update career in program object
                    this._careers[index] = c;
                    // console.log(this._careers[index]);

                    let writeOp = (career) => {
                        return [
                            {_code: career['_code'] },
                            Object.assign({}, {...career, lastUpdated: Date.now()}),
                            { upsert: true }
                        ]
                    }
                    // Update career in database
                    await db.addToCollection("careers", this._careers[index], writeOp);
                })
            }

            // Aggregate salary and growth data from careers
            await this._aggregateData();

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
            console.error(error);
        }
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
            // Map all careers to just national salary data and push each salary object into _aggregate_salary array.
            this._careers.map(career => career._salary).map(salary => salary['NationalWagesList']).forEach(salary => {
                this._aggregate_salary.push(new Salary(...Object.values(salary[0])));
            })
            // Reduce salary objects in array to single values.
            let o = this._aggregate_salary.reduce((obj, item) => {
                obj.Pct10 += item.Pct10,
                obj.Pct25 += item.Pct25,
                obj.Median += item.Median,
                obj.Pct75 += item.Pct75,
                obj.Pct90 += item.Pct90
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
            console.error(error.message);
        }
    }

    /**
     * Scans database to find all programs containing a specific O*NET Occupation code
     * and maps those programs into an array of related programs containing the program
     * title, degree types, and URL path to the Mesa academic program pages.
     * 
     * @async
     * @private
     * @see [DatabaseService] {@link modules:services/DatabaseService}
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