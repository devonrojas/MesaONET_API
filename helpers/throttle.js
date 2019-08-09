const throttle = async(calls, rateLimitCount, rateLimitTime) => {
    const totalCalls = calls.length;
    console.log(`Total calls: ${totalCalls}`);
    let p = [];
    while(calls.length > 0) {
        let callstoExecute = calls.slice(0, rateLimitCount);
        calls = calls.slice(rateLimitCount, calls.length);

        let promises = [];
        callstoExecute.forEach((call) => promises.push(new Promise((resolve, reject) => call(resolve))));

        let res = await Promise.all(promises);
        p = p.concat(res);
        await timeout(rateLimitTime);
    }
    return p;
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = throttle;