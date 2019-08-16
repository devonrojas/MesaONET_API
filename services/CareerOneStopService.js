const rp = require('request-promise');
const Occupation = require('../models/Occupation.js');

const CAREER_ONE_STOP_API_TOKEN = process.env.CAREER_ONE_STOP_API_TOKEN || "4qQ1K6ss1WXAmRynsMnkk23S/RbsFrf8IRQ5533DFTb1jep2U9ySAe3TI6b/3K3ZAIufJCGOgRKUy4v3XUAuDw==";
const CAREER_ONE_STOP_API_USERID = process.env.CAREER_ONE_STOP_API_USERID || "d7OIgpqbHGjmySa";

const CAREER_ONE_STOP_HEADERS = {
    'Authorization': "Bearer " + CAREER_ONE_STOP_API_TOKEN
}

const CAREER_ONE_STOP_BASE_URI = "https://api.careeronestop.org";

const fetch = async(code, title, growth, location, radius, days) => {
    try {
        let details = await buildOccupationDetails(code, location);
        return new Occupation(code, title, growth, details);
    } catch(error) {
        if(error.error) {
            console.error(error.error.Error);
        }
    }
}

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

const buildOccupationJobDetail = async(code, location = "US", radius = 25, days = 30, tries = 0) => {
    const OCCUPATION_JOB_DETAIL_URI = `/v1/jobsearch/${CAREER_ONE_STOP_API_USERID}/${code}/${location}/${radius}/${days}`;

    let options = buildOptions(OCCUPATION_JOB_DETAIL_URI);

    try {
        const data = await rp(options);
        return data;
    } catch(error) {
        if(error.statusCode == 404) {
            // console.error(error.error.Message + " for " + location);
            if(tries == 0) {
                // process.stdout.write("Retrying with state parameters...");
                return buildOccupationJobDetail(code, 'CA', radius, days, 1);
            } else if(tries == 1) {
                // process.stdout.write("Retrying with national parameters...");
                return buildOccupationJobDetail(code, 'US', radius, days, 2);
            } else {
                return null;
            }
        } else {
            if(error.name == "RequestError") {
                console.error("Request timed out.");
            } else {
                console.error('Unknown error.');
            }
        }
    }
}

function buildOptions(uri, params) {
    return {
        uri: CAREER_ONE_STOP_BASE_URI + uri,
        qs: params,
        headers: CAREER_ONE_STOP_HEADERS,
        json: true,
        timeout: 10000
    }
}

module.exports = {
    fetch,
    buildOccupationJobDetail
}