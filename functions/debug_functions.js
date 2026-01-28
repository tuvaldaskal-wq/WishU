
import * as functions from "firebase-functions/v1";
console.log('functions keys:', Object.keys(functions));
try {
    console.log('functions.https:', functions.https);
} catch (e) { }
console.log('functions.default:', functions.default);
