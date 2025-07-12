const axios = require("axios");
const logger = require("../utils/logger");
const { FACEBOOK_API_URL } = require("../config/envConfig");

const FIELDS = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "thumbnail_url",
  "media_product_type",
  "timestamp",
  "like_count",
  "comments_count",
  "permalink",
  "comments{id,from,text,timestamp,like_count,replies{from,timestamp,like_count,text}}",
].join(",");

async function fetchInstagramMedia(userId, accessToken) {
  const media = [];
  let nextPage = `https://graph.instagram.com/v17.0/${userId}/media`;
  let params = {
    access_token: accessToken,
    fields: "id,caption,media_type,media_url,permalink,timestamp,username,thumbnail_url",
    limit: 25,
  };

  while (nextPage) {
    try {
      const res = await axios.get(nextPage, { params });
      if (res.data.data && Array.isArray(res.data.data)) {
        media.push(...res.data.data);
      }
      nextPage = res.data.paging?.next || null;
      params = {}; // avoid repeating params with paging.next
    } catch (err) {
      logger.error("Error fetching media:", err.response?.data || err.message);
      throw err;
    }
  }

  return media;
}

const getFullMedia = async (userId, accessToken) => {
  try {
    const url = `https://graph.instagram.com/v23.0/${userId}/media`;

    const mediaResponse = await axios.get(url, {
      params: {
        fields: FIELDS,
        access_token: accessToken,
      },
    });

    logger.info("✅ Instagram media fetched successfully");

    return mediaResponse.data;
  } catch (error) {
    console.error("Error fetching media:", error.response?.data || error.message);
    logger.error(`Error fetching media: ${error.response?.data || error.message}`);
    throw error;
  }
};

const getAPost = async (postId, access_token) => {
  try {
    const postUrl = `${FACEBOOK_API_URL}/${postId}?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,children{media_url,media_type}&access_token=${access_token}`;
    const insightsUrl = `${FACEBOOK_API_URL}/${postId}/insights?metric=reach,views,likes,comments,saved,shares&access_token=${access_token}`;
    const commentsUrl = `${FACEBOOK_API_URL}/${postId}/comments?fields=id,username,text,timestamp,like_count,replies{username,text,timestamp,like_count}&order=chronological&access_token=${access_token}`;

    const [postResponse, insightsResponse, commentsResponse] = await Promise.all([axios.get(postUrl), axios.get(insightsUrl), axios.get(commentsUrl)]);
    logger.info(`✅ Instagram post fetched successfully`);

    return {
      ...postResponse.data,
      insights: insightsResponse.data.data,
      comments: commentsResponse.data.data,
    };
  } catch (error) {
    console.error(`🚨 Error getting full post details: ${error.message}`, error.response?.data);
    logger.error(`🚨 Error getting full post details: ${error.message}`, error.response?.data);
    throw error;
  }
};

module.exports = { fetchInstagramMedia, getFullMedia, getAPost };
