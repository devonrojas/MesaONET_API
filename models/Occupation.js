class Occupation {
    constructor(code, title, growth, details) {
        this.code = code;
        this.title = title;
        this.growth = growth;

        if(details) {
            if(details.hasOwnProperty("OnetDescription")) {
                this.description = details.OnetDescription;
            }
            if(details.hasOwnProperty("Wages")) {
                this.salary = this.buildSalary(details.Wages)
            }
            if(details.hasOwnProperty("EducationTraining")) {
                if(details.EducationTraining.hasOwnProperty("EducationType")) {
                    this.education = details.EducationTraining.EducationType;
                }
            }
            if(details.hasOwnProperty("Tasks")) {
                this.tasks = this.buildTasks(details.Tasks)
            }
            if(details.hasOwnProperty("COSVideoURL")) {
                this.video = details.COSVideoURL;
            }
        }
    
    }

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