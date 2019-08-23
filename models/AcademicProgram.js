/**
 * @module models/AcademicProgram
 * @author Devon Rojas
 */

const ONETService = require("../services/ONETService.js");
const db = require("../helpers/db.js");

const Career = require("./Career.js");
const Salary = require("./Salary.js");

/**
 * Description.
 */
class AcademicProgram {
    /**
     * Description.
     * @param {string} title 
     * @param {Array=[]} degree_types 
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
     * @name _retrieveAcademicProgramData
     */
    async _retrieveAcademicProgramData() {
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
                await asyncForEach(res, async(career) => {
                    // Build Career objects for all valid O*NET Codes
                    let c = new Career(career.code);
                    await c.retrieveCareerData();
                    c.related_programs = await this._buildRelatedProgramData(c._code);
        
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
                await asyncForEach(this._careers, async(career, index) => {
                    console.log("[" + (index + 1) + "/" + existingProgram[0]._careers.length + "] " + "Checking " + career._code + " | " + career._title + "...");
                    let c = Object.assign(new Career(), career);
                    c.related_programs = await this._buildRelatedProgramData(c._code);
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
     * @name _aggregateData
     */
    async _aggregateData() {
        try {
            this._careers.map(career => career._salary).map(salary => salary['NationalWagesList']).forEach(salary => {
                this._aggregate_salary.push(new Salary(...Object.values(salary[0])));
            })
            let o = this._aggregate_salary.reduce((obj, item) => {
                obj.Pct10 += item.Pct10,
                obj.Pct25 += item.Pct25,
                obj.Median += item.Median,
                obj.Pct75 += item.Pct75,
                obj.Pct90 += item.Pct90
                return obj;
            }, {Pct10: 0, Pct25: 0, Median: 0, Pct75: 0, Pct90: 0});
            Object.keys(o).forEach(key => {
                o[key] /= this._careers.length;
            })
            this._aggregate_salary = o;
    
            this._careers.map(career => career._growth).forEach(growth => {
                if(isNaN(growth)) {
                    this._aggregate_growth += +growth;
                } else {
                    this._aggregate_growth += growth;
                }
            })
            this._aggregate_growth /= this._careers.length;
        } catch(error) {
            console.error(error.message);
        }
    }

    /**
     * @name _buildRelatedProgramData
     */
    async _buildRelatedProgramData(code) {
        // Find all programs that have career code in _careers array.
        let relatedPrograms = await db.queryCollection("programs", { "_careers._code": code, "_title": { $ne: this._title } });

        // Include current program in related programs
        relatedPrograms.push(this);

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
        return relatedPrograms.sort((a, b) => {
            return a.title > b.title;
        });
    }
}

const asyncForEach = async (arr, cb) => {
    for (let i = 0; i < arr.length; i++) {
        await cb(arr[i], i, arr);
    }
};

module.exports = AcademicProgram;