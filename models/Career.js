/**
 * @module models/Career
 * @author Devon Rojas
 */

const db = require("../helpers/db");

const ONETService = require("../services/ONETService.js");
const CareerOneStopService = require("../services/CareerOneStopService.js");

/**
 * Description.
 */
class Career {
    /**
     * Description.
     * @param {string} code 
     */
    constructor(code) {
        /** @private */
        this._technical_skills;
        /** @private */
        this._growth;
        /** @private */
        this._tasks;
        /** @private */
        this._title;
        /** @private */
        this._salary;
        /** @private */
        this._description;
        /** @private */
        this._education;
        /** @private */
        this._video;
        /** @private */
        this._code = code;
        /** @private */
        this._related_programs = [];
    }

    /**
     * Sets the career's related programs.
     * @param arr 
     */
    set related_programs(arr) {
        this._related_programs = arr;
    }

    /**
     * Gets the career's related programs.
     * @return {Array} Array of related programs.
     */
    get related_programs() {
        return this._related_programs;
    }

    /**
     * @name _retrieveCareerData
     */
    async retrieveCareerData() {
        try {
            // Check if career data has already been generated. If it has, just return 
            // it instead of re-pulling data from ONET & CareerOneStop APIs.
            let existingCareer = await db.queryCollection("careers", {code: this._code});
            if(existingCareer.length === 0) {
                let career_one_stop_data = await CareerOneStopService.fetch(this._code, '92111');

                this._technical_skills = await ONETService.getCareerTechnicalSkills(this._code);
                this._growth = +(await db.queryCollection("growth_data", {soc_code: this._code.slice(0, this._code.indexOf("."))}))[0]['growth_pct'];
                this._tasks = this._buildTasks(career_one_stop_data['Tasks']);
                this._salary = this._buildSalary(career_one_stop_data['Wages']);
                this._title = career_one_stop_data['OnetTitle'];
                this._description = career_one_stop_data['OnetDescription'];
                this._education = career_one_stop_data['EducationTraining']['EducationType'];
                this._video = career_one_stop_data['COSVideoURL'];

                // Add new career data to database
                let writeOp = (career) => {
                    return [
                        { _code: career['_code'] },
                        Object.assign({}, {...career, lastUpdated: Date.now()}),
                        { upsert: true}
                    ]
                }
                await db.addToCollection("careers", this, writeOp);
            } else {
                console.log("Occupation: " + this._code + " exists in database already.");
                let obj = existingCareer[0];
                let o = {
                    _technical_skills: obj._technical_skills,
                    _title: obj._title,
                    _salary: obj._salary,
                    _tasks: obj._tasks,
                    _description: obj._description,
                    _video: obj._video,
                    _education: obj._education,
                    _growth: obj._growth,
                    _related_programs: obj_related_programs
                }
                Object.assign(this, o);
            }
        } catch(error) {
            console.log(error.message);
        }
    }

    /**
     * @name validateCareer
     * 
     * Checks all Career object properties for empty Arrays, Objects, and
     * null and undefined values.
     */
    async validateCareer() {
        return Object.keys(this).every(key => {
            if(!this[key]) {
                return false;
            } else {
                // console.log(key);
                if(Array.isArray(this[key])) {
                    if(this[key].length === 0) return false;
                } else if(Object.entries(this).length === 0 && this.constructor === Object) return false;
            }
            return true;
        })
    }

    /**
     * 
     * @param {Object} program 
     */
    addRelatedProgram(program) {
        if(this._related_programs.map(p => p.title).indexOf(program.title) === -1) {
            this._related_programs.push(program);
        } else {
            console.log(program.title + " is already in related programs array.");
        }
    }

    /**
     * @name buildSalary
     * 
     * @private
     * @inner
     * @param {Object} wages 
     */
    _buildSalary(wages) {
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
     * @name buildTasks
     * 
     * @private
     * @inner
     * @param {Array} tasks 
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