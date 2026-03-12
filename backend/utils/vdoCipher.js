const https = require("https");
const logger = require("../config/logger");

const VDOCIPHER_API_SECRET = process.env.VDOCIPHER_API_SECRET;
const VDOCIPHER_BASE_URL = "https://dev.vdocipher.com/api";

/**
 * Makes an authenticated request to VdoCipher API.
 */
const vdoRequest = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(VDOCIPHER_BASE_URL + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        Authorization: `Apisecret ${VDOCIPHER_API_SECRET}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(parsed.message || `VdoCipher API error: ${res.statusCode}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error("Failed to parse VdoCipher response"));
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

/**
 * Generate an OTP for secure video playback.
 * @param {string} videoId - VdoCipher video ID
 * @param {Array} annotations - Optional watermark annotations
 */
const generateVideoOTP = async (videoId, annotations = []) => {
  try {
    // ✅ VdoCipher only requires ttl — annotate is optional and must be array not string
    const body = { ttl: 300 };

    if (annotations.length > 0) {
      body.annotate = JSON.stringify(annotations); // ✅ VdoCipher expects a JSON string
    }

    const response = await vdoRequest("POST", `/videos/${videoId}/otp`, body);

    if (!response.otp || !response.playbackInfo) {
      throw new Error("Invalid response from VdoCipher — missing otp or playbackInfo");
    }

    return {
      otp: response.otp,
      playbackInfo: response.playbackInfo,
    };
  } catch (err) {
    logger.error(`VdoCipher OTP generation failed for video ${videoId}: ${err.message}`);
    throw new Error("Failed to generate video playback token.");
  }
};

/**
 * Get video details from VdoCipher.
 */
const getVideoDetails = async (videoId) => {
  try {
    return await vdoRequest("GET", `/videos/${videoId}`);
  } catch (err) {
    logger.error(`VdoCipher get video failed for ${videoId}: ${err.message}`);
    throw new Error("Failed to fetch video details.");
  }
};

/**
 * Delete a video from VdoCipher.
 */
const deleteVideo = async (videoId) => {
  try {
    return await vdoRequest("DELETE", `/videos?videos=${videoId}`);
  } catch (err) {
    logger.error(`VdoCipher delete video failed for ${videoId}: ${err.message}`);
    // Don't throw — deletion failure shouldn't block DB operations
    return null;
  }
};

module.exports = { generateVideoOTP, getVideoDetails, deleteVideo };