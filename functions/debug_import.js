
import * as admin from "firebase-admin";
console.log('admin keys:', Object.keys(admin));
console.log('admin.default:', admin.default);
try {
    console.log('admin.apps:', admin.apps);
} catch (e) { console.log('admin.apps error:', e.message); }
