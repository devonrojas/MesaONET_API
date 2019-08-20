/**
 * @module services/CareerOneStopService
 * @requires request-promise
 */

const rp = require('request-promise');
const Occupation = require('../models/Occupation.js');

const CAREER_ONE_STOP_API_TOKEN = process.env.CAREER_ONE_STOP_API_TOKEN || "4qQ1K6ss1WXAmRynsMnkk23S/RbsFrf8IRQ5533DFTb1jep2U9ySAe3TI6b/3K3ZAIufJCGOgRKUy4v3XUAuDw==";
const CAREER_ONE_STOP_API_USERID = process.env.CAREER_ONE_STOP_API_USERID || "d7OIgpqbHGjmySa";

const CAREER_ONE_STOP_HEADERS = {
    'Authorization': "Bearer " + CAREER_ONE_STOP_API_TOKEN
}

const CAREER_ONE_STOP_BASE_URI = "https://api.careeronestop.org";

/**
 * @name fetch
 * @memberof module:services/CareerOneStopService
 * 
 * @param {string} code 
 * @param {string} location 
 */
const fetch = async(code, location) => {
    try {
        return await buildOccupationDetails(code, location);
    } catch(error) {
        if(error.error) {
            console.error(error.error.Error);
        }
    }
}

/**
 * @name buildOccupationDetails
 * @inner
 * @memberof module:services/CareerOneStopService
 * 
 * @param {string} code 
 * @param {string} location 
 */
const buildOccupationDetails = async(code, location = "US") => {
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
 * @name buildOptions
 * @inner
 * @memberof module:services/CareerOneStopService
 * 
 * @param {string} uri 
 * @param {Object} params 
 */
function buildOptions(uri, params) {
    return {
        uri: CAREER_ONE_STOP_BASE_URI + uri,
        qs: params,
        headers: CAREER_ONE_STOP_HEADERS,
        json: true,
        timeout: 10000
    }
}

module.exports = { fetch }