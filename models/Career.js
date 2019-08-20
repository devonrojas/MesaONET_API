
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
     * @param {string} title 
     * @param {number} growth 
     * @param {Object} salary 
     * @param {Array} educationArr 
     */
    constructor(code) {
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
     * @name _retrieveCareerData
     */
    async _retrieveCareerData() {
        try {
            let career_one_stop_data = await CareerOneStopService.fetch(this._code, '92111');

            /** @private */
            this._technical_skills = await ONETService.getCareerTechnicalSkills(this._code);
            /** @private */
            this._growth = +(await db.queryCollection("growth_data", {soc_code: this._code.slice(0, this._code.indexOf("."))}))[0]['growth_pct'];
            /** @private */
            this._tasks = this._buildTasks(career_one_stop_data['Tasks']);
            /** @private */
            this._salary = this._buildSalary(career_one_stop_data['Wages']);
            /** @private */
            this._title = career_one_stop_data['OnetTitle'];
            /** @private */
            this._description = career_one_stop_data['OnetDescription'];
            /** @private */
            this._education = career_one_stop_data['EducationTraining']['EducationType'];
            /** @private */
            this._video = career_one_stop_data['COSVideoURL'];
        } catch(error) {
            console.log(error.message);
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