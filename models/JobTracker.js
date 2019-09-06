/**
 * @module models/JobTracker
 * @author Devon Rojas
 * 
 * @requires services/CareerOneStopService
 * @requires services/GoogleMapsService
 * @requires services/DatabaseService
 * @requires helpers/Utils
 */

const CareerOneStopService = require("../services/CareerOneStopService.js");
const GoogleMapsService = require("../services/GoogleMapsService.js");
const db = require("../services/DatabaseService.js");
const Utils = require("../helpers/utils.js");

const FETCH_PERIOD = 30; // Days
const STATES = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "DC",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY"
];

/**
 * Class containing logic to build job posting data for an O*NET Occupation.
 */
class JobTracker {
    /**
     * Creates a JobTracker object.
     * @param {string} location   A location (Zip code, city, or state)
     */
    constructor(code, location="92111") {
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
            let areaSearch = location.short_name;

            if(location.types.includes("administrative_area_level_2")) {
                return;
            }
            if(this._areas.map(area => area.area.short_name).includes(location.short_name)) {
                return;
            }
            // Map zip code to county for querying purposes
            if(location.types.includes("postal_code")) {
                areaSearch = (await GoogleMapsService.getCounty(areaSearch)).short_name;   
            }

            // Check if record already exists for career code and current location
            let res = await db.queryCollection("job_tracking", {"_code": this._code, "_areas.area.short_name": areaSearch});

            let area;

            // Job Tracker record doesn't exist for area in database
            if(res.length === 0) {

                // If location is a zip code, look up appropriate county
                if(location.types.includes('postal_code')) {
                    area = new CountyArea(location);
                    area.setArea(await GoogleMapsService.getCounty(location.short_name));
                } else {
                    area = new PrimitiveArea(location);
                }
                await area.init(this._code);
                this._areas.push(area);

                // Push new area onto Job Tracker record in database
                const writeOperation = (data) => [
                    {"_code": data["code"] },
                    {
                        $push: {"_areas": data["area"]}
                    },
                    { upsert: true}
                ]
                await db.addToCollection("job_tracking", {code: this._code, area: area}, writeOperation);

            } // Job Tracker area record exists already
            else {
                if(res[0].hasOwnProperty("lastUpdated")) {
                    delete res[0]["lastUpdated"];
                }
                let index = res[0]["_areas"].map(item => item.area.short_name).indexOf(areaSearch);
                if(location.types.includes('postal_code')) {
                    area = Object.assign(new CountyArea(location), res[0]["_areas"][index]);
                    area.addZipCodeAlias(location.short_name);
                } else {
                    area = Object.assign(new PrimitiveArea(location), res[0]["_areas"][index]);
                }
                // Update any data in area if necessary
                await area.update(this._code);
                this._areas.push(area);
                // Update database document with new data
                const writeOperation = (data) => [
                    {"_code": data["code"], "_areas.area.short_name": areaSearch },
                    { $set: { "_areas.$": data["area"]} }
                ]
                await db.addToCollection("job_tracking", {code: this._code, area: area}, writeOperation);
            }
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
        let location = await GoogleMapsService.findLocation(this._location);

        this._location = location[0].short_name;

        let locations;
        let data = await db.queryCollection("job_tracking", {"_code": this._code});
        if(data.length !== 0) {
            data = data.map(item => item["_areas"].map(el => el.area));
            locations = data[0];
        } else {
            locations = [];
        }
        locations = locations.concat(location);
        // Filter any duplicate locations out of array
        this._locations = [...new Set(Array.from(locations).map(area => area.short_name).concat(STATES))]
        .map(area => {
            return locations.find(loc => loc.short_name === area)
        });
    }
}

/**
 * Class representing an area containing monthly [records]{@link module:models/JobTracker~JobRecord} of job postings.
 */
class PrimitiveArea {
    /**
     * Creates a job posting area.
     * @param {object} area             Location object
     * @param {string} area.short_name  Name of area
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

    static get FETCH_PERIOD() {
        return FETCH_PERIOD;
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
     * @see {@link modules:services/CareerOneStopService|CareerOneStopService}
     * @see {@link modules:models/JobTracker~JobRecord|JobRecord}
     * 
     * @param {string} code A valid O*NET Occupation code
     */
    async init(code) {
        try {
            await this.fetch(code);
        } catch(error) {
            console.error(error);
        }
    }

    /**
     * Updates area with any necessary job records.
     * @async 
     * 
     * @param {string} code A valid O*NET Occupation code
     */
    async update(code) {
        try {
            // Verify that area needs to be updated
            let needToUpdate = this.data.every(record => JobRecord.needsToBeUpdated(record));
            if(needToUpdate) {
                await this.fetch(code);
            } else {
                // console.log("Area doesn't need to be updated at this time.");
            }
        } catch(error) {
            console.error(error.messsage);
        }
    }

    
    /**
     * Retrieves job data for area.
     * 
     * @param {string}      code        A valid O*NET Occupation code
     * @param {number}      [radius=25] The radius around a location to search job postings in
     */
    async fetch(code, area = this.area, radius = 25) {
        try {
            let record = new JobRecord();
            
            let jobs = await CareerOneStopService.fetchJobDetail(code, area, radius, PrimitiveArea.FETCH_PERIOD);
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
     * @see {@link module:models/JobTracker~AreaRadius|AreaRadius}
     * 
     * @param {object} location             Location object
     * @param {string} location.short_name  A valid US Zip code
     */
    constructor(location) {
        super(location);
        
        /** @private */
        this._zip_code_aliases = [location.short_name];

        this.data = [new AreaRadius(25), new AreaRadius(50), new AreaRadius(75), new AreaRadius(100)];
    }

    /**
     * Adds a zip code to object's zip code alias array.
     * @param {string|number} zip  A valid US Zip code
     */
    addZipCodeAlias(zip) {
        if(typeof zip === 'string') {
            if(isNaN(parseInt(zip))) {
                throw new TypeError("Argument could not be processed.");
            } else {
                if(this._zip_code_aliases.indexOf(zip) === -1) {
                    this._zip_code_aliases.push(zip.toString());
                }
            }
        } else if(typeof zip === 'number') {
            if(zip.toString().length !== 5) {
                throw new TypeError("Argument is not a valid zip code. Argument must contain 5 digits.");
            } else {
                if(this._zip_code_aliases.indexOf(zip) === -1) {
                    this._zip_code_aliases.push(zip.toString());
                }
            }
        } else {
            throw new TypeError("Argument could not be processed. Argument must be a 5 digit number or string.")
        }
    }

    /**
     * Updates area with any necessary job records.
     * @async 
     * 
     * @param {string} code A valid O*NET Occupation code
     */
    async update(code) {
        try {
            // Test only first AreaRadius object's data
            let needToUpdate = this.data[0].data.every(record => JobRecord.needsToBeUpdated(record));

            if(needToUpdate) {
                // Fetch updated data for all AreaRadius objects
                await this.fetch(code);
            } else {
                // console.log("Area doesn't need to be updated at this time.")
            }
        } catch(error) {
            console.error(error.messsage);
        }
    }

    /**
     * Retrieves job data for an area with different radius values.
     * @override
     * 
     * @see {@link module:services/CareerOneStopService|CareerOneStopService}
     * 
     * @param {string} code A valid O*NET Occupation code
     */
    async fetch(code) {
        let index = Math.floor(Math.random() * (+this._zip_code_aliases.length));
        let location = this._zip_code_aliases[index];
        location = {short_name: location, types: ['postal_code']};
        try {
            await Utils.asyncForEach(this.data, async(radius) => {
                let record = new JobRecord();
            
                let jobs = await CareerOneStopService.fetchJobDetail(code, location, radius._radius, PrimitiveArea.FETCH_PERIOD);
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
                radius = Object.assign(new AreaRadius(radius._radius), radius);
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

    static needsToBeUpdated(record) {
       let d = new Date();
       let month = d.getMonth() + 1;
       let year = d.getFullYear();

       return (month > record._month) || (year > record._year);
    }
    
}

module.exports = JobTracker;