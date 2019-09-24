/**
 * @module services/ONETService
 * @author Devon Rojas
 * 
 * @requires {@link https://www.npmjs.com/package/request-promise| request-promise}
 */

require("dotenv").config();
const rp = require('request-promise');

const ONET_API_AUTH = process.env.ONET_API_AUTH;

const ONET_API_HEADERS = {
    Authorization: ONET_API_AUTH,
    Accept: 'application/json'
}

const ONET_OPTIONS = {
    headers: ONET_API_HEADERS,
    json: true
}

// Search results threshold
const RELEVANCE_SCORE_CAP = 50;

/**
 * Retrieves technical skills associated with an O*NET
 * Occupation code.
 * 
 * @name getCareerTechnicalSkills
 * @memberof module:services/ONETService
 * @function
 * 
 * @param {string} code O*NET code to query.
 * @return {null|Array} Array of technical skills.
 */
const getCareerTechnicalSkills = async(code) => {
    // console.log("Pulling career technical skills from O*NET Web Services...");
    const careerTechnicalSkillsUrl = "https://services.onetcenter.org/ws/mnm/careers/" + code + "/technology";
    try {
        let data = await rp(careerTechnicalSkillsUrl, ONET_OPTIONS);
        if(data.hasOwnProperty("category")) {
            let technical_skills = data.category;
            // Map technical skills to just its name.
            technical_skills = technical_skills
            .map(skill => skill.example
                .map(el => el.name));
            
            // Flatten array
            let arr = [].concat.apply([], technical_skills);

            return arr;
        } else return null;
    } catch(error) {
        console.error(error.message);
        return null;
    }
}

/**
 * Retrieves RIASEC code associated with an O*NET
 * Occupation code.
 * 
 * @name getCareerTechnicalSkills
 * @memberof module:services/ONETService
 * @function
 * 
 * @param {string} code O*NET code to query.
 * @return {null|String} RIASEC code.
 */
const getRIASECCode = async(code) => {
    const interestsUrl = "https://services.onetcenter.org/ws/online/occupations/" + code + "/summary/interests";
    try {
        let data = await rp(interestsUrl, ONET_OPTIONS);
        if(data.hasOwnProperty("high_point_code")) {
            let RIASEC = data["high_point_code"];
            return RIASEC;
        } else {
            return null;
        }
    } catch(error) {
        console.error(error.message);
        return null;
    }
}

/**
 * @name fetch
 * @memberof module:services/ONETService
 * @function
 * 
 * @param {string} url URL to send a request to.
 */
const fetch = async(url, relevance_score) => {
    try {
        ONET_OPTIONS.uri = url;    
        let result = await rp(ONET_OPTIONS);
        if(result.hasOwnProperty('keyword')) {
            let total = result.total;
            url += "&start=1&end=" + total;
            ONET_OPTIONS.uri = url;
    
            result = await rp(ONET_OPTIONS);

            result = result.hasOwnProperty('occupation') 
            ? result.occupation.filter(res => res.relevance_score > relevance_score)
                    .map(res => {return {code: res.code, title: res.title}}) 
            : null;
        }
        else {
            return null;
        }
        return result;
    } catch(error) {
        if(error.statusCode == 422) {
            console.error("No valid response from " + url);
        }
        return null;
    }
}

module.exports = { fetch, getCareerTechnicalSkills, getRIASECCode }
