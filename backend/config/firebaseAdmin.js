const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let firebaseApp = null;

try {
    // 1. Try Environment Variable (For Vercel/Production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("[Firebase Admin] Initialized from Environment Variable.");
    }
    // 2. Try Local File (For Development)
    else {
        const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("[Firebase Admin] Initialized from local file.");
        } else {
            console.warn("[Firebase Admin] No credentials found (Env var or File). Firebase features disabled.");
        }
    }
} catch (error) {
    console.error("[Firebase Admin] Initialization failed:", error.message);
}

module.exports = { admin, firebaseApp };
