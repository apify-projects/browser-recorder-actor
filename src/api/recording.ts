import { AxiosResponse } from "axios";

const axios = require('axios').default;

export const getServerUrl = async() : Promise<string> => {
  try {
    const response = await axios.get(`/record/serverUrl`)
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Couldn\'t start recording');
    }
  } catch(error: any) {
    return '';
  }
};

export const startRecording = async() : Promise<string> => {
  try {
    const response = await axios.get(`/record/start`)
    if (response.status === 200) {
        return response.data;
    } else {
        throw new Error('Couldn\'t start recording');
    }
  } catch(error: any) {
    return '';
  }
};

export const stopRecording = async (id: string): Promise<void> => {
    await axios.get(`/record/stop/${id}`)
        .then((response : AxiosResponse<boolean>)  => {
        })
        .catch((error: any) => {
        });
};

export const getActiveBrowserId = async(): Promise<string> => {
    try {
        const response = await axios.get(`/record/active`);
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error('Couldn\'t get active browser');
        }
    } catch(error: any) {
        return '';
    }
};

export const interpretCurrentRecording = async(): Promise<boolean> => {
    try {
        const response = await axios.get(`/record/interpret`);
        if (response.status === 200) {
            return true;
        } else {
            throw new Error('Couldn\'t interpret current recording');
        }
    } catch(error: any) {
        console.log(error);
        return false;
    }
};

export const stopCurrentInterpretation = async(): Promise<void> => {
  try {
    const response = await axios.get(`/record/interpret/stop`);
    if (response.status === 200) {
      return;
    } else {
      throw new Error('Couldn\'t interpret current recording');
    }
  } catch(error: any) {
    console.log(error);
  }
};

export const getCurrentUrl = async (): Promise<string | null> => {
  try {
    const response = await axios.get(`/record/active/url`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Couldn\'t retrieve stored recordings');
    }
  } catch(error: any) {
    console.log(error);
    return null;
  }
};

export const getCurrentTabs = async (): Promise<string[] | null> => {
  try {
    const response = await axios.get(`/record/active/tabs`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Couldn\'t retrieve stored recordings');
    }
  } catch(error: any) {
    console.log(error);
    return null;
  }
};
