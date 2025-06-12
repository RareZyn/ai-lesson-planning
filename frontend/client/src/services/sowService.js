import axios from 'axios';

const getAuthConfig = () => ({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
});

/**
 * Fetches the Scheme of Work (SOW) for a given grade.
 * @param {string} grade - The grade for which to fetch the SOW.
 * @returns {Promise<object>} A promise that resolves to the SOW for the given grade.
 * @throws {Error} If the API returns an invalid response structure or an error.
 */
export const getSow = async (grade) => {
  const { data } = await axios.get(`/api/sow/${grade}`, getAuthConfig());

  if (!data || !data.data) {
    throw new Error('Invalid response structure from SOW API');
  }

  return data.data;
};
