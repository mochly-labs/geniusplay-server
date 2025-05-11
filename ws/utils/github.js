const axios = require("axios");

let cachedVersion = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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
    const headers = {
      "Accept": "application/vnd.github+json",
      "User-Agent": "GeniusPlay-Version-Fetcher",
      ...(GITHUB_TOKEN && { Authorization: `Bearer ${GITHUB_TOKEN}` }),
      "X-GitHub-Api-Version": "2022-11-28",
    };

    // Parallel fetch: latest release + file content
    const [releaseRes, typeRes] = await Promise.all([
      axios.get(
        "https://api.github.com/repos/mochly-labs/genius-play/releases/latest",
        { headers }
      ),
      axios.get(
        "https://api.github.com/repos/mochly-labs/genius-play/contents/type.txt",
        { headers }
      ),
    ]);

    const version = releaseRes.data.tag_name;

    const typeContent = Buffer.from(typeRes.data.content, "base64")
      .toString("utf-8")
      .trim();
    const type = capitalize(typeContent);

    cachedVersion = `${type} ${version}`;
    cacheTimestamp = now;

    return cachedVersion;
  } catch (err) {
    console.error(
      "Error fetching version info:",
      err.response?.data || err.message
    );
    return null;
  }
}

module.exports = getPrettyVersion;
