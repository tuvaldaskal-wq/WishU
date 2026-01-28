try {
    const myFunctions = require('./lib/index.js');
    console.log("Exports keys:", Object.keys(myFunctions));
    console.log("Ping function:", myFunctions.ping);
} catch (e) {
    console.error("Error requiring lib/index.js:", e);
}
