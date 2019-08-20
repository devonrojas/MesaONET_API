/**
 * @module models/Occupation
 */

 /**
  * Description
  */
class Occupation {
    /**
     * Description.
     * 
     * @param {string} code 
     * @param {string} title 
     * @param {number} growth 
     * @param {string} details 
     */
    constructor(code, title, growth, details) {
        /** @private */
        this.code = code;
        /** @private */
        this.title = title;
        /** @private */
        this.growth = growth;

        if(details) {
            if(details.hasOwnProperty("OnetDescription")) {
                /** @private */
                this.description = details.OnetDescription;
            }
            if(details.hasOwnProperty("Wages")) {
                /** @private */
                this.salary = this.buildSalary(details.Wages)
            }
            if(details.hasOwnProperty("EducationTraining")) {
                if(details.EducationTraining.hasOwnProperty("EducationType")) {
                    /** @private */
                    this.education = details.EducationTraining.EducationType;
                }
            }
            if(details.hasOwnProperty("Tasks")) {
                /** @private */
                this.tasks = this.buildTasks(details.Tasks)
            }
            if(details.hasOwnProperty("COSVideoURL")) {
                /** @private */
                this.video = details.COSVideoURL;
            }
        }
    
    }

    /**
     * @name buildSalary
     * 
     * @private
     * @inner
     * @param {Object} wages 
     */
    buildSalary(wages) {
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
    buildTasks(tasks) {
        let t = tasks.map(task => {
            if(task.hasOwnProperty("TaskDescription")) {
                return task.TaskDescription;
            } else return null;
        }).filter(task => task != null);
        return t;
    }
}

module.exports = Occupation;