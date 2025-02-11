import axios from 'axios';
import RNFetchBlob from 'rn-fetch-blob';
import {addKeyToStorage, getValueFromStorage} from '../helpers/asyncStorage';
import Toast from 'react-native-toast-message';

export const COLORS = {
  bgGrey: '#F2F2F2',
  theme: '#02618E',
  bgBlue: '#DFF1FF',
  white: '#fff',
  borderColor: '#000',
};

export const TxtWeight = {
  Bold: 'bold',
  Semi: '600',
  Light: '300',
  Medium: '500',
  Regular: '400',
};

export const TxtSize = {
  XXS: 8.5,
  XS: 10.5,
  SM: 13.5,
  MD: 15,
  LG: 18,
  XL: 24,
  XXL: 32,
};

export const Space = {
  XL: 30,
  LG: 20,
  MD: 15,
  SM: 10,
  XS: 5,
};

export const username = 'SuperUser';
export const password = 'System';

// Base URL Helper
const getBaseUrl = async () => {
  const protocol = await getValueFromStorage('protocol');
  const port = await getValueFromStorage('port');
  const host = await getValueFromStorage('host');
  return `${protocol}://${host}:${port}`;
};

// Token Helper
const getAuthToken = async () => {
  return await getValueFromStorage('token');
};

// Authenticate User
export async function authenticateUser(username, password) {
  const protocol = await getValueFromStorage('protocol');
  const port = await getValueFromStorage('port');
  const host = await getValueFromStorage('host');
  const baseUrl = `${protocol}://${host}:${port}`;
  console.log('baseUrl==>', baseUrl);

  const requestBody = JSON.stringify({
    userName: username,
    password: password,
  });

  const response = await RNFetchBlob.config({trusty: true}).fetch(
    'POST',
    `${baseUrl}/api/v1/auth/tokens`,
    {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    requestBody,
  );

  const data = await response.json();
  return data?.token; // Return the token
}

// Update Token
export async function updateToken(authToken) {
  const protocol = await getValueFromStorage('protocol');
  const port = await getValueFromStorage('port');
  const host = await getValueFromStorage('host');
  const baseUrl = `${protocol}://${host}:${port}`;

  const requestBody = JSON.stringify({
    clientId: 1000002,
    roleId: 1000016,
    organizationId: 1000020,
    warehouseId: 0,
    language: 'en_Us',
  });

  const response = await RNFetchBlob.config({trusty: true}).fetch(
    'PUT',
    `${baseUrl}/api/v1/auth/tokens`,
    {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    requestBody,
  );

  const data = await response.json();
  return data?.token; // Return the updated token
}

// Fetch Data by ID
export const fetchAssetDetailsById = async assetNumber => {
  try {
    const authToken = await getValueFromStorage('token'); // Get token from storage
    const protocol = await getValueFromStorage('protocol');
    const host = await getValueFromStorage('host');
    const port = await getValueFromStorage('port');
    const baseUrl = `${protocol}://${host}:${port}`;
    const url = `${baseUrl}/api/v1/models/A_Asset?$filter=value eq '${assetNumber}'`;

    const response = await RNFetchBlob.config({trusty: true}).fetch(
      'GET',
      url,
      {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
    );

    const result = await response.json();
    if (result?.records?.length > 0) {
      return result.records[0]; // Return the first record
    } else {
      throw new Error('No Asset Found');
    }
  } catch (error) {
    console.error('Error fetching asset details:', error);
    throw error;
  }
};

// FETCH DATA OF HOME SCREEN
export const fetchHomeScreenData = async () => {
  try {
    const authToken = await getValueFromStorage('token'); // Get token from storage
    const protocol = await getValueFromStorage('protocol');
    const host = await getValueFromStorage('host');
    const port = await getValueFromStorage('port');
    const baseUrl = `${protocol}://${host}:${port}`;
    const url = `${baseUrl}/api/v1/processes/api_homescreen`;

    const response = await RNFetchBlob.config({trusty: true}).fetch(
      'POST',
      url,
      {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
      JSON.stringify({test: 'test'}),
    );

    const result = await response.json();
    if (result) {
      return result; // Return the first record
    } else {
      throw new Error('No Asset Found');
    }
  } catch (error) {
    console.error('Error fetching asset details:', error);
    throw error;
  }
};

// FETCH PROJECTS
export const fetchProjects = async () => {
  try {
    const authToken = await getValueFromStorage('token'); // Get token from storage
    const protocol = await getValueFromStorage('protocol');
    const host = await getValueFromStorage('host');
    const port = await getValueFromStorage('port');
    const baseUrl = `${protocol}://${host}:${port}`;
    const url = `${baseUrl}/api/v1/models/ER_AssetVerification?$filter=DocStatus eq 'DR'`;

    const response = await RNFetchBlob.config({trusty: true}).fetch(
      'GET',
      url,
      {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
    );

    const result = await response.json();
    if (result?.records?.length > 0) {
      return result.records; // Return the list of projects
    } else {
      throw new Error('No Projects Found');
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

// FETCH RECORDS BY PROJECT
export const fetchProjectLinesById = async verificationId => {
  try {
    const authToken = await getValueFromStorage('token'); // Get token from storage
    const protocol = await getValueFromStorage('protocol');
    const host = await getValueFromStorage('host');
    const port = await getValueFromStorage('port');
    const baseUrl = `${protocol}://${host}:${port}`;
    const url = `${baseUrl}/api/v1/models/ER_AssetVerificationLine?$filter=ER_AssetVerification_ID eq ${verificationId}`;

    const response = await RNFetchBlob.config({trusty: true}).fetch(
      'GET',
      url,
      {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
    );

    const result = await response.json();
    if (result?.records?.length > 0) {
      return result.records; // Return the list of lines
    } else {
      throw new Error('No Project Lines Found');
    }
  } catch (error) {
    console.error('Error fetching project lines:', error);
    throw error;
  }
};

// UPDATE PROJECT RECORDS
export const updateProjectLine = async (lineId, updatedData) => {
  try {
    const authToken = await getValueFromStorage('token'); // Get token from storage
    const protocol = await getValueFromStorage('protocol');
    const host = await getValueFromStorage('host');
    const port = await getValueFromStorage('port');
    const baseUrl = `${protocol}://${host}:${port}`;
    const url = `${baseUrl}/api/v1/models/ER_AssetVerificationLine/${lineId}`;
    console.log('lineId=>', lineId);
    console.log('url=>', url);

    const response = await RNFetchBlob.config({trusty: true}).fetch(
      'PUT',
      url,
      {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      JSON.stringify({Status: true}),
    );

    const result = await response.json();
    if (result) {
      console.log('result==>', result);
      return result; // Return the updated result
    } 
    // else {
    //   console.log('result==>', result);
    //   throw new Error('Error updating project line');
    // }
  } catch (error) {
    console.log('error=>', error);
    const errorTitle = error?.title || 'Update Failed';
    const errorDetail =
      error?.detail || 'An error occurred while updating the project line.';

    // Show Toast with fallback values
    Toast.show({
      type: 'error',
      text1: error.message,
      position: 'bottom',
    });

    // console.error('Error updating project line:', error.message);
    throw error;
  }
};
