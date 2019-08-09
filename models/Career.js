class Career {
    constructor(code, title, growth, salary, educationArr) {
        this.code = code;
        this.title = title;
        this.growth = growth;
        if(salary) {
            this.salary = salary;
        };
        if(educationArr != null) {
            this.education = educationArr;
        };
    }
}

module.exports = Career;