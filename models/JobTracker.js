/**
 * @module models/JobTracker
 * @author Devon Rojas
 * 
 * @requires services/CareerOneStopService
 * @requires services/DatabaseService
 * @requires helpers/Utils
 */

const CareerOneStopService = require("../services/CareerOneStopService.js");
const GoogleMapsService = require("../services/GoogleMapsService.js");
const Utils = require("../helpers/utils.js");

/**
 * Class containing logic to build job posting data for an O*NET Occupation.
 */
class JobTracker {
    /**
     * Creates a JobTracker object.
     * @param {object} location 
     * @param {string} location.zip
     * @param {string} location.county
     * @param {string} location.state
     */
    constructor(code, location = {zip: "92111"}) {
        /** @private */
        this._code = code;
        /** @private */
        this._location = location;

        /** @private */
        this._locations = [];
        /** @private */
        this._areas = [];
    }

    /**
     * Retrieves job tracking area data.
     * @return {Array} Array of job tracking data
     */ 
    getAreas() {
        return this._areas;
    }

    /**
     * Pulls all job tracking data for all areas associated with an O*NET Occupation Code.
     * @async
     * 
     * @see {@link module:services/GoogleMapsService|GoogleMapsService}
     * @see {@link module:services/DatabaseService|DatabaseService}
     */
    async retrieveData() {
        await this._getLocations();
        await Utils.asyncForEach(this._locations, async(location) => {
            // let res = await db.queryCollection("job_tracking", {"_code": this._code, "_areas.area.short_name": location.short_name});
            // If no data exists for location

            let area;
            // If location is a zip code, look up appropriate county
            if(location.types.includes('postal_code')) {
                area = new CountyArea(location);
                area.setArea(await GoogleMapsService.getCounty(location.short_name));
            } else {
                area = new PrimitiveArea(location);
            }

            await area.init(this._code);
            this._areas.push(area);

            // } else {
            //     // Check if location needs to be updated
            //     let area = new Area(location);
            //     Object.assign(area, res[0]);
            //     await area.update(this._code);
            //     console.log(area);
            // }
        })
    }

    /**
     * Retrieves Google Maps location data from a zip code and builds an array of
     * zip code, county, state, and country location data.
     * @async
     * @private
     * 
     * @see {@link module:services/GoogleMapsService|GoogleMapsService}
     * @see {@link module:services/DatabaseService|DatabaseService}
     */
    async _getLocations() {
        let location = await GoogleMapsService.findLocation(this._location.zip);

        let locations = [];
        // let data = await db.queryCollection("job_tracking", {"careercode": this._code});
        // data = data.map(item => item.jobcount.map(el => el.area));
        // let locations = data[0];

        this._locations = [...new Set(locations.concat(location))];
    }
}

/**
 * Class representing an area containing monthly [records]{@link module:models/JobTracker~JobRecord} of job postings.
 */
class PrimitiveArea {
    /**
     * Creates a job posting area.
     * @param {object} area             Location object.
     * @param {string} area.short_name  Name of area.
     * @param {Array}  area.types       Area types
     */
    constructor(area) {
        /** @private */
        this.area = area;
        /** @private */
        this.data = [];
        /** @private */
        this.top10Companies = [];
    }

    /**
     * Retrieves the data of an area.
     * @return {object} Object containing area name and type(s)
     */
    getArea() {
        return this.area;
    }

    /**
     * Retrieves the job data associated with area.
     * @return {Array} 
     */ 
    getData() {
        return this.data;
    }

    /**
     * Retrieves the companies associated with the area.
     * @return {Array} 
     */ 
    getCompanies() {
        return this.top10Companies;
    }

    setArea(area) {
        this.area = area;
    }

    /**
     * Initializes a new area.
     * @async
     * 
     * @see [CareerOneStopService] {@link modules:services/CareerOneStopService}
     * @see [JobRecord]            {@link JobRecord}
     * 
     * @param {string} code
     */
    async init(code) {
        try {
            await this.fetch(code);
        } catch(error) {
            console.error(error);
        }
    }

    // FIX
    /**
     * Updates area with any necesssary job records.
     * @async 
     * 
     * @param {string} code
     */
    async update(code) {
        try {
            await Utils.asyncForEach(this.data, async(record) => {
                let idx = radius.data.indexOf(item => (item.month == new Date().getMonth() + 1) && (item.year == new Date().getFullYear()));
                // If no data for current month and year in radius
                if(idx === -1) {
                    await radius.fetch(this.area.short_name, code);
                } else {
                    console.log(this.area = " area data doesn't need to be updated.");
                }
            })
        } catch(error) {
            console.error(error.messsage);
        }
    }

    
    /**
     * Retrieves job data for area.
     * 
     * @param {string}      code
     * @param {number}      [radius=25]
     */
    async fetch(code, area = this.area.short_name, radius = 25) {
        try {
            let record = new JobRecord();
            
            let jobs = await CareerOneStopService.fetchJobDetail(code, area, radius, 30);
            if(jobs) {
                record.setJobCount(jobs.hasOwnProperty("Jobcount") ? +jobs["Jobcount"] : 0);
    
                let companies = jobs.hasOwnProperty("Companies") ? jobs["Companies"] : [];
    
                if(companies && companies.length > 0) {
                    record.setCompanyCount(companies.length); // Keep track of individual area company counts
                    companies = companies
                    .map(company => { // Modify array
                        return {
                            name: company.CompanyName,
                            jobcount: +company.JobCount
                        }
                    })
                    .sort((a, b) => { // Sort companies by highest job count
                        let val1 = a.jobcount;
                        let val2 = b.jobcount;
        
                        if(val1 > val2) {
                            return -1;
                        } else if(val1 < val2) {
                            return 1;
                        }
                    })
                    // Remove duplicates
                   companies = [...new Set(companies.map(company => company.name))]
                    .map(name => {
                        return companies.find(company => company.name === name);
                    });
                     // Take only 10 elements
                    this.top10Companies = companies.slice(0, 10);
    
                } else { // Error pulling company data - Do not continue updating data
                    throw new Error("No company data for " + code);
                }
            }
            this.data.push(record);
        } catch(error) {
            console.error(error.message);
        }
    }
}

/**
 * Class representing a county containing monthly [records]{@link module:models/JobTracker~JobRecord} 
 * of job postings, categorized by radius.
 */
class CountyArea extends PrimitiveArea {
    /**
     * Creates a county job posting area. This object contains a collection of zip codes that fall
     * within the county to assist in data retrieval from the [CareerOneStop]{@link module:services/CareerOneStopService} API.
     * 
     * @see [AreaRadius]{@link module:models/JobTracker~AreaRadius}
     * 
     * @param {object} location Location object.
     */
    constructor(location) {
        super(location);
        
        /** @private */
        this._zip_code_aliases = [location.short_name];

        this.data = [new AreaRadius(25), new AreaRadius(50), new AreaRadius(100)];
    }

    /**
     * Retrieves job data for an area with different radius values.
     * @override
     * 
     * @see [CareerOneStopService]{@link module:services/CareerOneStopService}
     */
    async fetch(code) {
        let index = Math.floor(Math.random() * (+this._zip_code_aliases.length));
        let location = this._zip_code_aliases[index];

        try {
            await Utils.asyncForEach(this.data, async(radius) => {
                let record = new JobRecord();
            
                let jobs = await CareerOneStopService.fetchJobDetail(code, location, radius._radius, 30);
                if(jobs) {
                    record.setJobCount(jobs.hasOwnProperty("Jobcount") ? +jobs["Jobcount"] : 0);
        
                    let companies = jobs.hasOwnProperty("Companies") ? jobs["Companies"] : [];
        
                    if(companies && companies.length > 0) {
                        record.setCompanyCount(companies.length); // Keep track of individual area company counts
                        companies = companies
                        .map(company => { // Modify array
                            return {
                                name: company.CompanyName,
                                jobcount: +company.JobCount
                            }
                        })
                        .sort((a, b) => { // Sort companies by highest job count
                            let val1 = a.jobcount;
                            let val2 = b.jobcount;
            
                            if(val1 > val2) {
                                return -1;
                            } else if(val1 < val2) {
                                return 1;
                            }
                        })
                        // Remove duplicates
                        companies = [...new Set(companies.map(company => company.name))]
                        .map(name => {
                            return companies.find(company => company.name === name);
                        });
                            // Take only 10 elements
                        this.top10Companies = companies.slice(0, 10);
        
                    } else { // Error pulling company data - Do not continue updating data
                        throw new Error("No company data for " + code);
                    }
                }
                radius.addRecord(record);
            })
        } catch(error) {
            console.error(error.message);
        }
    }
}

/**
 * Class representing job data within a certain radius.
 */
class AreaRadius {
    /**
     * Creates an object to hold job data within a certain radius.
     * @param {number} radius Radius to pull job data in.
     */
    constructor(radius) {
        /** @private */
        this._radius = radius;
        /** @private */
        this.data = [];
    }

    /**
     * Retrieves radius of object.
     * @return {number} Radius value.
     */ 
    getRadius() {
        return this._radius;
    }

    /**
     * Retrives data of object.
     * @return {Array} Job data for the specified radius.
     */ 
    getData() {
        return this.data;
    }

    /**
     * Adds a [Job Record]{@link module:models/JobTracker~JobRecord} to data.
     * @param {object} record   A [Job Record]{@link module:models/JobTracker~JobRecord}.
     */ 
    addRecord(record) {
        this.data.push(record);
    }
}

/**
 * Class representing a single monthly job record for an area.
 */
class JobRecord {
    /**
     * Creates a job record.
     */
    constructor() {
        let d = new Date();
        /** @private */
        this._month = d.getMonth() + 1;
        /** @private */
        this._year = d.getFullYear();
        /** @private */
        this._jobcount = 0;
        /** @private */
        this._companycount = 0;
    }

    /**
     * Sets job count.
     * @param {number} count Value to set job count to.
     */
    setJobCount(count) {
        if(!isNaN(count)) {
            this._jobcount = count;
        } else {
            throw new Error("Value must be a number.")
        }
    }

    /**
     * Sets company count.
     * @param {count} count Value to set company count to.
     */
    setCompanyCount(count) {
        if(!isNaN(count)) {
            this._companycount = count;
        } else {
            throw new Error("Value must be a number.")
        }
    }

    /**
     * Retrieves job count.
     * @return {number} Job count.
     */
    getJobCount() {
        return this._jobcount;
    }

    /**
     * Retrieves company count.
     * @return {number} Company count.
     */
    getCompanyCount() {
        return this._companycount;
    }
}

module.exports = JobTracker;