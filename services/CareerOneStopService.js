/**
 * @module services/CareerOneStopService
 * @author Devon Rojas
 * 
 * @requires {@link https://www.npmjs.com/package/request-promise| request-promise}
 */

require("dotenv").config();
const rp = require('request-promise');

const CAREER_ONE_STOP_API_TOKEN     = process.env.CAREER_ONE_STOP_API_TOKEN;
const CAREER_ONE_STOP_API_USERID    = process.env.CAREER_ONE_STOP_API_USERID;
const CAREER_ONE_STOP_HEADERS       = { 'Authorization': "Bearer " + CAREER_ONE_STOP_API_TOKEN };
const CAREER_ONE_STOP_BASE_URI      = "https://api.careeronestop.org";

/**
 * Retrieves O*NET occupation data from CareerOneStop API.
 * 
 * @name fetch
 * @memberof module:services/CareerOneStopService
 * @function
 * 
 * @param {string} code              O*NET Occupation code.
 * @param {string} [location='US']   Location to query (state or zip code).
 * 
 * @return {object} Occupation data.
 */
const fetch = async(code, location = 'US') => {
    const OCCUPATION_DETAILS_URI = `/v1/occupation/${CAREER_ONE_STOP_API_USERID}/${code}/${location}`;

    let params = {
        training: true,
        videos: true,
        tasks: true,
        wages: true,
        projectedEmployment: true
    }

    let options = buildOptions(OCCUPATION_DETAILS_URI, params);

    try {
        const data = await rp(options);
        if(data.hasOwnProperty("OccupationDetail")) {
            return data['OccupationDetail'][0];
        }
    } catch(error) {
        console.error(error);
    }
}

/**
 * Retrieves job posting data for an O*NET Occupation code.
 * 
 * @name fetchJobDetail
 * @memberof module:services/CareerOneStopService
 * @function
 * 
 * @param {string} code             O*NET Occupation code to fetch data for.
 * @param {string} [location="US"]  Location to query.
 * @param {number} [radius=25]      Radius from location to search.
 * @param {number} [days=30]        Length to retrieve data back to.
 * @param {number} [tries=0]        Amount of tries of function (error-handling purposes)
 * 
 * @return {object} Job posing data for occupation.
 */
const fetchJobDetail = async(code, location = 'US', radius = 25, days = 30, tries = 0) => {
    const OCCUPATION_JOB_DETAIL_URI = `/v1/jobsearch/${CAREER_ONE_STOP_API_USERID}/${code}/${location}/${radius}/${days}`;
    let options = buildOptions(OCCUPATION_JOB_DETAIL_URI);

    try {
        const data = await rp(options);
        return data;
    } catch(error) {
        if(error.statusCode == 404) {
            if(tries == 0) {
                console.log("No data found for " + location + ". Trying CA...");
                return fetchJobDetail(code, 'CA', radius, days, 1);
            } else if(tries == 1) {
                console.log("No data found for " + location + ". Trying US...");
                return fetchJobDetail(code, 'US', radius, days, 2);
            } else {
                return null;
            }
        } else {
            if(error.name == "RequestError") {
                console.log("Request timed out.");
                return fetchJobDetail(code, location, radius, days, 2);
            } else {
                console.error("Unknown error.");
            }
        }
    }
} 

/**
 * @name buildOptions
 * @function
 * @memberof module:services/CareerOneStopService
 * @private
 * 
 * @param {string} uri 
 * @param {Object} params 
 */
const buildOptions = (uri, params) => {
    return {
        uri: CAREER_ONE_STOP_BASE_URI + uri,
        qs: params,
        headers: CAREER_ONE_STOP_HEADERS,
        json: true,
        timeout: 10000
    }
}

module.exports = { fetch, fetchJobDetail }