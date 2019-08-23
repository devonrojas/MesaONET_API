/**
 * @module services/ONETService
 * @author Devon Rojas
 * 
 * @requires request-promise
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
 * @name getCareerTechnicalSkills
 * @memberof module:services/ONETService
 * @function
 * 
 * @param {string} code 
 */
const getCareerTechnicalSkills = async(code) => {
    // console.log("Pulling career technical skills from O*NET Web Services...");
    const careerTechnicalSkillsUrl = "https://services.onetcenter.org/ws/mnm/careers/" + code + "/technology";
    try {
        let data = await rp(careerTechnicalSkillsUrl, ONET_OPTIONS);
        if(data.hasOwnProperty("category")) {
            let technical_skills = data.category;
            technical_skills = technical_skills
            .map(skill => skill.example
                .map(el => el.name));
            
            let arr = [].concat.apply([], technical_skills);

            return arr;
        } else return null;
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
 * @param {string} url 
 */
const fetch = async(url) => {
    try {
        ONET_OPTIONS.uri = url;    
        let result = await rp(ONET_OPTIONS);
        if(result.hasOwnProperty('keyword')) {
            let total = result.total;
            url += "&start=1&end=" + total;
            ONET_OPTIONS.uri = url;
    
            result = await rp(ONET_OPTIONS);

            result = result.hasOwnProperty('occupation') 
            ? result.occupation.filter(res => res.relevance_score > RELEVANCE_SCORE_CAP)
                    .map(res => {return {code: res.code, title: res.title}}) 
            : null;
        }
        else if(result.hasOwnProperty('job_outlook')) {
            if(result.job_outlook.hasOwnProperty('salary')) {
                let l = result.job_outlook.salary.annual_10th_percentile;
                let m = result.job_outlook.salary.annual_median ? 
                                result.job_outlook.salary.annual_median 
                        : result.job_outlook.salary.annual_median_over ? 
                            result.job_outlook.salary.annual_median_over 
                        : null;
                let h = result.job_outlook.salary.annual_90th_percentile ? 
                            result.job_outlook.salary.annual_90th_percentile
                        : result.job_outlook.salary.annual_90th_percentile_over ? 
                            result.job_outlook.salary.annual_90th_percentile_over
                        : null;

                if(l && m && h) {
                    result = {
                        low: l,
                        median: m,
                        high: h
                    }
                } else return null;
            } else return null;
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

module.exports = { fetch, getCareerTechnicalSkills }
