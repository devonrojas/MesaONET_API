const CareerOneStopService = require("../services/CareerOneStopService.js");

async function pullData(career, code, location = {zip: "92111", county: "San Diego County", state: "CA" }) {
    let areas = ["US"];
    if(!career) {
        career = {
            jobcount: [],
            lastUpdated: Date.now(),
            careercode: code
        };
    } else {
        areas = career.jobcount.map(el => el.area);
        console.log("Career data exists. Pulling new data...");
    }
    console.log(areas);
    console.log(Object.keys(location).filter(k => k != "zip").map(k => location[k]));
    console.log(areas.concat(Object.keys(location).filter(k => k != "zip").map(k => location[k])));
    // Combine existing areas with any new queried areas
    areas = [...new Set(areas.concat(Object.keys(location).filter(k => k != "zip").map(k => location[k])))];
    console.log(areas);

    let result = {};
    let retry = false;

    try {
        career['lastUpdated'] = Date.now(); // Set timestamp    
        
        await asyncForEach(areas, async(area) => {
            let areaIdx = career.jobcount.findIndex(x => x.area == area);
            if(areaIdx == -1) { // Area data doesn't exist
                let o = {
                    area: area,
                    data: []
                }
                areaIdx = career['jobcount'].push(o) - 1; // Returns length of array
            }
            let a = career['jobcount'][areaIdx];

            let month = new Date().getMonth() + 1;
            let year = new Date().getFullYear();
            // Check to see if data exists for current month/year
            let dataIdx = a.hasOwnProperty("data") ? a.data.findIndex(d => (d.month == month && d.year == year)) : -1;
            let d;
            // If not, create a new object to push onto array
            if(dataIdx == -1) {
                let o = {
                    month: month,
                    year: year,
                    jobcount: 0,
                    companycount: 0
                }
                dataIdx = a.data.push(o) - 1;
                d = a.data[dataIdx];

                // Count jobs from last 30 days
                if(area == location.county) {
                    area = location.zip; // Swap county with contained zip code for correct querying
                }

                let jobs = await CareerOneStopService.buildOccupationJobDetail(code, area, 25, 30);

                if(jobs) {
                    d["jobcount"] = jobs.hasOwnProperty("Jobcount") ? +jobs["Jobcount"] : 0;

                    let companies = jobs.hasOwnProperty("Companies") ? jobs["Companies"] : [];

                    if(companies && companies.length > 0) {
                        d["companycount"] = companies.length; // Keep track of individual area company counts;
                        a["companies"] = companies
                        .map(company => { // Modify array
                            return {
                                name: company.CompanyName,
                                jobcount: +company.JobCount
                            }
                        })
                        .reduce((acc, cur) => { // Remove duplicate companies
                            const el = acc.find(item => item.name === cur.name);
                            if(!el) {
                                return acc.concat([cur]);
                            } else {
                                return acc;
                            }
                        }, [])
                        .sort((a, b) => { // Sort companies by highest job count
                            let val1 = a.jobcount;
                            let val2 = b.jobcount;
            
                            if(val1 > val2) {
                                return -1;
                            } else if(val1 < val2) {
                                return 1;
                            }
                        })
                        .slice(0, 10); // Take only 10 elements;

                    } else { // Error pulling company data - Do not continue updating data
                        throw new Error("No company data for " + code);
                    }
                } else { // Data retrieval unsuccessful - Try again
                    retry = true;
                }
            } else { // Data already exists for current date
                d = a.data[dataIdx];
            }
            a.data[dataIdx] = d;
            career['jobcount'][areaIdx] = a;
        })
        // console.log(career.jobcount);


    } catch(error) {
        retry = true;
        console.error(error);
    } finally {
        result['retry'] = retry;
        result['career'] = career;
        return result;
    }
}

const asyncForEach = async(arr, cb) => {
    for(let i = 0; i < arr.length; i++) {
        await cb(arr[i], i, arr);
    }
}

module.exports = {
    pullData
};