const Career = require("./Career.js");

class AcademicProgram {
    constructor(title, degree_types) {
        this._title = title;
        this._code;
        this._careers = [];
        this._degree_types = degree_types;
        this._salary = {};
        this._aggregate_growth = 0;
    }

    async _retrieveAcademicProgramData() {
        // Pull all careers that match program title
        // Build Career objects for all valid O*NET Codes
        // Append results to careers array
        // Aggregate salary and growth data from careers
    }
}

module.exports = AcademicProgram;