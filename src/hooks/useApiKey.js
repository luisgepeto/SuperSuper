import { useState, useEffect, useCallback } from 'react';
import apiKeyStorage from '../services/apiKeyStorage';

export const useApiKey = (keyName) => {
  const [value, setValue] = useState('');

  // Load the initial value from storage
  useEffect(() => {
    const storedValue = apiKeyStorage.getKey(keyName);
    setValue(storedValue);
  }, [keyName]);

  // Update handler that saves to storage automatically
  const updateValue = useCallback((newValue) => {
    setValue(newValue);
    apiKeyStorage.setKey(keyName, newValue);
  }, [keyName]);

  // Clear the key from storage
  const clearValue = useCallback(() => {
    setValue('');
    apiKeyStorage.removeKey(keyName);
  }, [keyName]);

  return {
    value,
    setValue: updateValue,
    clearValue
  };
};
