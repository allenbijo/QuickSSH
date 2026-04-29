const e = require("electron"); console.log("type:", typeof e); if(typeof e === "object") { console.log("keys:", Object.keys(e || {}).join(",")); } else { console.log("value:", e); } process.exit(0);
