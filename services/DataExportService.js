/**
 * @module services/DataExportService
 * @author Devon Rojas
 * 
 * @requires models/Career
 * @requires helpers/Utils
 */

require("dotenv").config();

const Career = require("../models/Career.js");
const Utils = require("../helpers/utils.js");

/**
 * @deprecated
 * Class containing logic to build occupations from an array of O*NET Codes.
 */
class DataExportService {

    /**
     * Builds DataExportService object.
     * @param {Array} params 
     */
    constructor(params) {
        /** @private */
        this.defaultParams = params ? params : ["92111", 25, 30];
    }

    /**
     * Generates occupation data from an array of O*NET occupation codes.
     * @async
     * 
     * @param {Array} arr       Array of codes to pull data from.
     * @param {Array} [data=[]] Array to add retrieved data to.
     * 
     * @return {Array}  Complete array of [Careers]{@link module:models/Career}.
     */
    async buildData(arr, data = []) {
        await Utils.asyncForEach(arr, async(item, index) => {
            console.log("[" + (index + 1) + "/" + arr.length + "]" + " Pulling " + item.code + " data...");
            try {
            let c = new Career(item.code);
            c.retrieveCareerData();
            
            data.push(c);

            } catch(error) {
                console.error("Error pulling data.");
            }
        })
        return data;
    }
}

module.exports = DataExportService;