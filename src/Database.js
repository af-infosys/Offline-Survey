import SQLite from 'react-native-sqlite-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = SQLite.openDatabase({
  name: 'SurveyOffline.db',
  location: 'default',
});

export const initDB = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS offline_surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        formData TEXT,
        floors TEXT,
        isSynced INTEGER DEFAULT 0,
        createdAt TEXT
      )`,
    );
  });
};

// Metadata (Areas/Societies) को स्टोर करने के लिए
export const saveMetadata = async (key, data) => {
  await AsyncStorage.setItem(key, JSON.stringify(data));
};

export const getMetadata = async key => {
  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};
