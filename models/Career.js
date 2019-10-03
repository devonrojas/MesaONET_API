/**
 * @module models/Career
 * @author Devon Rojas
 * 
 * @requires services/DatabaseService
 * @requires services/ONETService
 * @requires services/CareerOneStopService
 * @requires models/JobTracker
 */

const db = require("../services/DatabaseService");
const ONETService = require("../services/ONETService.js");
const CareerOneStopService = require("../services/CareerOneStopService.js");

const JobTracker = require("./JobTracker.js");

/**
 * Class representing O*NET and CareerOneStop Occupation data, and any
 * academic programs associated with it.
 */
class Career {
    /**
     * Create a career.
     * @param {string} code A valid O*NET Code.
     */
    constructor(code) {
        /** @private */
        this.technical_skills;
        /** @private */
        this.growth;
        /** @private */
        this.tasks;
        /** @private */
        this.title;
        /** @private */
        this.salary;
        /** @private */
        this.description;
        /** @private */
        this.education;
        /** @private */
        this.video;
        /** @private */
        this.code = code;
        /** @private */
        this.related_programs = [];
    }

    /**
     * Sets the career's related programs.
     * @param arr An array of related programs.
     */
    setRelatedPrograms(arr) {
        if(Array.isArray(arr)) {
            this.related_programs = arr;
        } else {
            throw new TypeError("Argument must be an array.");
        }
    }

    /**
     * Gets the career's related programs.
     * @return {Array} Array of related programs.
     */
    getRelatedPrograms() {
        return this.related_programs;
    }

    /**
     * Adds a program to the object's related_programs array.
     * @param {Object}  program      A related program object
     * @param {string}  title        Program title
     * @param {Array}   degree_types An array of degrees associated with a program
     * @param {string}  parth        A URL path pointing to a Mesa Academic Program page
     */
    addRelatedProgram(program) {
        if(this.related_programs.map(p => p.code).indexOf(program.code) === -1) {
            this.related_programs.push(program);
        } else {
            console.log(program.title + " is already in related programs array.");
        }
    }

    /**
     * Checks database for existing career data, and if it doesn't exist, builds
     * a new Career object. If a new object is created, a {@link module:models/JobTracker|JobTracker}
     * object is also generated and added to its appropriate database collection.
     * @async
     * 
     * @see {@link module:services/DatabaseService|DatabaseService}
     * @see {@link module:services/ONETService|ONETService}
     * @see {@link module:services/CareerOneStopService|CareerOneStopService}
     * @see {@link module:models/JobTracker|JobTracker}
     */
    async retrieveCareerData() {
        try {
            // Check if career data has already been generated. If it has, just return 
            // it instead of re-pulling data from ONET & CareerOneStop APIs.
            let existingCareer = await db.queryCollection("careers", {code: this.code});
            // Career doesn't exist
            if(existingCareer.length === 0) {
                // Get national career data
                let career_one_stop_data = await CareerOneStopService.fetch(this.code);

                this.technical_skills = await ONETService.getCareerTechnicalSkills(this.code);
                this.riasec_code = await ONETService.getRIASECCode(this.code);
                this.growth = +(await db.queryCollection("growth_data", {soc_code: this.code.slice(0, this.code.indexOf("."))}))[0]['growth_pct'];
                this.tasks = this._buildTasks(career_one_stop_data['Tasks']);
                this.salary = this._buildSalary(career_one_stop_data['Wages']);
                this.title = career_one_stop_data['OnetTitle'];
                this.description = career_one_stop_data['OnetDescription'];
                this.education = career_one_stop_data['EducationTraining']['EducationType'];
                this.video = career_one_stop_data['COSVideoURL'];

                await this.saveToDatabase();

                // Create a job tracking record for the new career
                let job_tracker = new JobTracker(this.code);
                await job_tracker.retrieveData();
                const writeOperation = (data) => [
                    { "code": data["code"] },
                    {
                        "code": data["code"],
                        "_areas": data.getAreas(),
                        "lastUpdated": Date.now()
                    },
                    { upsert: true}
                ]
                // Add to job_tracking database
                await db.addToCollection("job_tracking", job_tracker, writeOperation);
            }
            // Career exists
            else {
                console.log("Occupation: " + this.code + " exists in database already.");
                let obj = existingCareer[0];
                if(obj.hasOwnProperty("lastUpdated")) {
                    delete obj["lastUpdated"];
                }
                // Create Career object out of database data
                Object.assign(this, obj);
            }
        } catch(error) {
            console.log(error.message + " | Career code: " + this.code);
        }
    }

    /**
     * Checks all Career object properties for empty Arrays, Objects, and
     * null and undefined values.
     * 
     * @async
     * 
     * @return {boolean} Boolean indicating whether object is complete
     */
    async validateCareer() {
        const keys_to_validate = [
            "code", 
            "related_programs", 
            "technical_skills", 
            "growth", 
            "tasks", 
            "salary", 
            "title", 
            "description", 
            "education", 
            "video"
        ];
        console.log(this);

        return Object.keys(this).every(key => {
            if(!this[key]) {
                return false;
            } else {
                if(!keys_to_validate.includes(key)) {
                    return false;
                } else {
                // console.log(key);
                    if(Array.isArray(this[key])) {
                        if(this[key].length === 0) return false;
                    } else if(Object.entries(this).length === 0 && this.constructor === Object) return false;
                };
            }
            return true;
        })
    }

    /**
     * Saves career data to careers collection in database
     * 
     * @async
     * 
     * @see {@link module:services/DatabaseService|DatabaseService}
     */
    async saveToDatabase() {
        try {
            // Add career data to database
            let writeOp = (career) => {
                return [
                    { code: career['code'] },
                    Object.assign({}, {...career, lastUpdated: Date.now()}),
                    { upsert: true}
                ]
            }
            await db.addToCollection("careers", this, writeOp);
        } catch(error) {
            console.error(error.message);
        }
    }

    /**
     * Updates salary data
     * @async
     *
     * @see {@link module:services/CareerOneStopService|CareerOneStopService}
     *  
     * @param {string} location Location to search
     */
    async updateSalary(location) {
        let career_one_stop_data = await CareerOneStopService.fetch(this.code, location);
        this.salary = this._buildSalary(career_one_stop_data['Wages']);
    }

    /**
     * Builds an object containing national, state, and local salary data for Career.
     * 
     * @private
     * @param {object} wages {@link https://api.careeronestop.org/api-explorer/home/index/Occupations_GetOccupationDetails|CareerOneStop API Wage JSON object}
     * 
     * @return {object} Salary object with national, state, and local breakdown.
     */
    _buildSalary(wages) {
        // Based off CareerOneStop API JSON reponse structure
        let keys = ['NationalWagesList', 'StateWagesList', 'BLSAreaWagesList'];
        let percentiles = ['Pct10', 'Pct25', 'Median', 'Pct75', 'Pct90'];

        let salary = Object.keys(wages)
        .filter(key => keys.includes(key))
        .reduce((obj, key) => {
            obj[key] = wages[key]
            .filter(x => x['RateType'] == 'Annual')
            .map(x => {
                let ky = Object.keys(x)
                        .filter(k => percentiles.includes(k))
                        .reduce((ob, k) => {
                            ob[k] = x[k];
                            return ob;
                        }, {});
                return ky;
            });
            return obj;
        }, {});
        return salary;
    }

    /**
     * Builds an array of tasks associated with an O*NET Occupation.
     * 
     * @private
     * @param {Array} tasks {@link https://api.careeronestop.org/api-explorer/home/index/Occupations_GetOccupationDetails|CareerOneStop API Tasks JSON object}
     * 
     * @return {Array} Task descriptions.
     */
    _buildTasks(tasks) {
        let t = tasks.map(task => {
            if(task.hasOwnProperty("TaskDescription")) {
                return task.TaskDescription;
            } else return null;
        }).filter(task => task != null);
        return t;
    }
}

module.exports = Career;