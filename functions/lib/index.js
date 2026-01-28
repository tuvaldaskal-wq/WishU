"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanityCheck = void 0;
const https_1 = require("firebase-functions/v2/https");
exports.sanityCheck = (0, https_1.onRequest)((req, res) => {
    res.send("I am alive!");
});
//# sourceMappingURL=index.js.map