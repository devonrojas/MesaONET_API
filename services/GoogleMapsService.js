/**
 * @module services/GoogleMapsService
 * @author Devon Rojas
 * 
 * @requires {@link https://www.npmjs.com/package/request-promise| request-promise}
 */

const rp = require("request-promise");

const GOOGLE_MAPS_API_KEY =process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_URI = "https://maps.googleapis.com/maps/api/geocode/json?address=";

/**
 * Retrieves zip code, county, state, and country location components from a keyword.
 * @name findLocation
 * @function
 * 
 * @param {string} location Location to reverse lookup.
 * 
 * @return {Array} Location components.
 */
const findLocation = async(location) => {
    let res = await _fetch(location);
    res = res
    .map(item => {return { short_name: item.short_name, types: item.types }})
    .filter(item => 
        !item.types.includes("locality") &&
        !item.types.includes("neighborhood") &&
        !item.types.includes("administrative_area_level_2"));
    return res;
}

/**
 * Retrives county component from a keyword.
 * @name getCounty
 * @function
 * 
 * @param {string} location Location to reverse lookup
 * 
 * @return {object} County location data.
 */
const getCounty = async(location) => {
    let res = await _fetch(location);
    let res1 = res
    .map(item => {return { short_name: item.short_name, types: item.types }})
    .filter(item => {
        if(item.types.includes("administrative_area_level_2")) {
            return true;
        } else {
            if(item.types.includes("administrative_area_level_1") && !item.types.includes("administrative_area_level_2")) {
                return true;
            }
        }
        return false;
    });
    if(res1.length == 0) {
        console.log("No county data available for " + location);
        return false;
    }
    return res1[0];
}

/**
 * Retrieves state component from a keyword.
 * @name getState
 * @function
 * 
 * @param {string} location Location to reverse lookup
 * 
 * @return {object} State location data
 */
const getState = async(location) => {
    let res = await _fetch(location);
    let res1 = res
    .map(item => {return { short_name: item.short_name, types: item.types }})
    .filter(item => {
        if(item.types.includes("administrative_area_level_1")) {
            return true;
        }
        return false;
    });
    if(res1.length == 0) {
        console.log("No state data available for " + location);
        return false;
    }
    return res1[0];
}

/**
 * Fetches data from Google Maps Geocoding API.
 * 
 * @see {@link https://developers.google.com/maps/documentation/geocoding|Google Maps Geocoding API}
 * 
 * @param {string} location 
 * 
 * @return {object} Location data.
 */
const _fetch = async(location) => {
    let url = GOOGLE_MAPS_URI + location + "&key=" + GOOGLE_MAPS_API_KEY;
    let options = {
        json: true
    };

    let res = (await rp(url, options)).results[0].address_components;
    return res;
}

module.exports = { findLocation, getCounty, getState }