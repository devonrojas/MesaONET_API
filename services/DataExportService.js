/**
 * @module services/DataExportService
 * @author Devon Rojas
 * 
 * @requires {@link CareerService}
 * @requires {@link CareerOneStopService}
 */

const CareerService = require("../helpers/main");
const CareerOneStopService = require("./CareerOneStopService");

/**
 * Description
 */
class DataExportService {

    /**
     * Description
     * @param {Array} params 
     */
    constructor(params) {
        /** @private */
        this.defaultParams = params ? params : ["92111", 25, 30];
    }

    /**
     * @name buildData
     * Generates occupation data for each .
     * 
     * @param {Array} arr 
     * @param {Array} data 
     */
    async buildData(arr, data = []) {
        await asyncForEach(arr, async(item, index) => {
            console.log("[" + (index + 1) + "/" + arr.length + "]" + " Pulling " + item.code + " data...");
            try {
            let career_one_stop_data = await CareerOneStopService.fetch(item.code, item.title, item.growth, ...this.defaultParams);
            let technical_skills = await CareerService.getCareerTechnicalSkills(item.code);

            const o = {
                ...item,
                ...career_one_stop_data,
                technical_skills: technical_skills
            }
            
            data.push(o);

            } catch(error) {
                console.error("Error pulling data.");
            }
        })
        return data;
    }
}

const asyncForEach = async(arr, cb) => {
    for(let i = 0; i < arr.length; i++) {
        await cb(arr[i], i, arr);
    }
}

module.exports = DataExportService;