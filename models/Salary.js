/**
 * @module models/Salary
 * @author Devon Rojas
 */

/**
 * Class representing salary percentile distributions per each Career.
 */
class Salary {
    /**
     * Creates a salary.
     * @param {number} pct10    10th Percentile salary value.
     * @param {number} pct25    25th Percentile salary value.
     * @param {number} median   Median salary value.
     * @param {number} pct75    75th Percentile salary value.
     * @param {number} pct90    90th Percentile salary value.
     */
    constructor(pct10, pct25, median, pct75, pct90) {
        Object.keys(arguments).forEach(key => {
            if(isNaN(arguments[key])) {
                if(typeof arguments[key] === "string") {
                    if(arguments[key].indexOf("+") === -1) {
                        throw new TypeError("Salary object constructor encountered an unhandled value.");
                    } else {
                        arguments[key] = arguments[key].replace("+", "").replace(",", "");
                    }
                } else if(typeof arguments[key] !== 'number') {
                    throw new TypeError("Salary object constructor requires number values. Value passed in: " + arguments[key])
                }
            }
            arguments[key] = +arguments[key];
        })
        /** @private */
        this._Pct10  = arguments[0] || 0;
        /** @private */
        this._Pct25  = arguments[1] || arguments[0];
        /** @private */
        this._Median = arguments[2] || arguments[1] || arguments[0];
        /** @private */
        this._Pct75  = arguments[3] || arguments[2] || arguments[1] || arguments[0];
        /** @private */
        this._Pct90  = arguments[4] || arguments[3] || arguments[2] || arguments[1] || arguments[0];
    }

    /** 
     * Get the 10th Percentile salary value.
     * @return {number} 10th percentile salary.
     */
    getPct10() {
        return this._Pct10;
    }

    /** 
     * Get the 25th Percentile salary value.
     * @return {number} 25th percentile salary.
     */
    getPct25() {
        return this._Pct25;
    }

    /** 
     * Get the 50th Percentile salary value.
     * @return {number} Median salary.
     */
    getMedian() {
        return this._Median;
    }

    /** 
     * Get the 75th Percentile salary value.
     * @return {number} 75th percentile salary.
     */
    getPct75() {
        return this._Pct75;
    }

    /** 
     * Get the 90th Percentile salary value.
     * @return {number} 90th percentile salary.
     */
    getPct90() {
        return this._Pct90;
    }

    /** 
     * Sets the 10th Percentile salary value.
     * @param {number} val The value to set.
     */
    setPct10(val) {
        if(isNaN(val)) {
            throw new TypeError("Value must be a number.");
        }
        this._Pct10 = val;
    }

    /** 
     * Sets the 25th Percentile salary value.
     * @param {number} val The value to set.
     */
    setPct25(val) {
        if(isNaN(val)) {
            throw new TypeError("Value must be a number.");
        }
        this._Pct25 = val;
    }

    /** 
     * Sets the 50th Percentile salary value.
     * @param {number} val The value to set.
     */
    setMedian(val) {
        if(isNaN(val)) {
            throw new TypeError("Value must be a number.");
        }
        this._Median = val;
    }

    /**
     * Sets the 75th Percentile salary value.
     * @param {number} val The value to set.
     */
    setPct75(val) {
        if(isNaN(val)) {
            throw new TypeError("Value must be a number.");
        }
        this._Pct75 = val;
    }

    /** 
     * Sets the 90th Percentile salary value.
     * @param {number} val The value to set.
     */
    setPct90(val) {
        if(isNaN(val)) {
            throw new TypeError("Value must be a number.");
        }
        this._Pct90 = val;
    }
}

module.exports = Salary;