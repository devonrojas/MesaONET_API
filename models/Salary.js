/**
 * @module models/Salary
 */

/**
 * Description
 */
class Salary {
    /**
     * Description
     * @param {number} low 
     * @param {number} med 
     * @param {number} high 
     */
    constructor(low, med, high) {
        /** @private */
        this._low = low;
        /** @private */
        this._median = med;
        /** @private */
        this._high = high;
    }

    /**
     * Get the low salary value.
     * @return {number} low salary
     */
    get low() {
        return this._low;
    }

    /**
     * Get the median salary value.
     * @return {number} median salary
     */
    get median() {
        return this._median;
    }

    /**
     * Get the high salary value.
     * @return {number} high salary
     */
    get high() {
        return this._high;
    }

    /**
     * Sets the low salary value.
     * @param {number} val The value to set.
     */
    set low(val) {
        if(isNaN(val)) {
            throw new TypeError("Value must be a number.");
        }
        this._low = val;
    }

    /**
     * Sets the median salary value.
     * @param {number} val The value to set.
     */
    set median(val) {
        if(isNaN(val)) {
            throw new TypeError("Value must be a number.");
        }
        this._median = val;
    }

    /**
     * Sets the high salary value.
     * @param {number} val The value to set.
     */
    set high(val) {
        if(isNaN(val)) {
            throw new TypeError("Value must be a number.");
        }
        this._high = val;
    }
}

module.exports = Salary;