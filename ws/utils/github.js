const axios = require("axios");

let cachedVersion = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Capitalizes the first letter of a string
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Fetches the latest release tag and type, returns a string like "Alpha v2.0.4"
 * Uses in-memory cache for 10 minutes.
 * @returns {Promise<string|null>}
 */
async function getPrettyVersion() {
  const now = Date.now();
  if (cachedVersion && now - cacheTimestamp < CACHE_DURATION) {
    return cachedVersion;
  }

  try {
    const [releaseRes, typeRes] = await Promise.all([
      axios.get(
        "https://api.github.com/repos/mochly-labs/genius-play/releases/latest",
        {
          headers: { "User-Agent": "axios" },
        }
      ),
      axios.get(
        "https://raw.githubusercontent.com/mochly-labs/genius-play/main/type.txt"
      ),
    ]);

    const version = releaseRes.data.tag_name;
    const type = capitalize(typeRes.data.trim());
    cachedVersion = `${type} ${version}`;
    cacheTimestamp = now;

    return cachedVersion;
  } catch (err) {
    console.error("Error fetching version info:", err.message);
    return null;
  }
}

module.exports = getPrettyVersion;
