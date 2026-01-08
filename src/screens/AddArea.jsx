import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import BASE_URL from '../../config';

const AddArea = () => {
  const [areaName, setAreaName] = useState('');
  const [loading, setLoading] = useState(false);

  const [areas, setAreas] = useState([]);

  const fetchCachedAreas = async () => {
    const raw = await AsyncStorage.getItem('cached_areas');
    const cachedAreas = raw ? JSON.parse(raw) : [];
    setAreas(cachedAreas);
  };

  const handleAddArea = async () => {
    if (!areaName.trim()) {
      Alert.alert('Error', 'Area name empty hai');
      return;
    }

    setLoading(true);

    try {
      const raw = await AsyncStorage.getItem('cached_areas');
      const cachedAreas = raw ? JSON.parse(raw) : [];

      const net = await NetInfo.fetch();

      // 🔹 default area object (offline-first)
      const newArea = {
        id: cachedAreas.length + 1, // temp id
        name: areaName.trim(),
        isSynced: false,
      };

      // 🔹 ONLINE → direct API hit
      if (net.isConnected) {
        console.log({ areaName: newArea.name });
        try {
          const res = await fetch(`${BASE_URL}/api/sheet/areas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ areaName: newArea.name }),
          });

          const json = await res.json();

          if (res.ok && json?.data) {
            newArea.id = json.data.id;
            newArea.isSynced = true;
          }

          Alert.alert('Success', 'Area Added on The Internet!');
        } catch (e) {
          // online fail → offline fallback

          const updated = [...cachedAreas, newArea];

          await AsyncStorage.setItem('cached_areas', JSON.stringify(updated));

          setAreaName('');

          Alert.alert(
            'Added Offline',
            'Area Added Locally, connect to internet to sync',
          );
          return;
        }
      }

      const updated = [...cachedAreas, newArea];

      await AsyncStorage.setItem('cached_areas', JSON.stringify(updated));

      setAreaName('');

      Alert.alert('Added Sucessfully', 'Area Added Locally!');
    } catch (e) {
      console.log('Add area error', e);
      Alert.alert('Error', 'Area add nahi hua');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCachedAreas();
  }, [loading]);

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Add New Society</Text>

      <TextInput
        value={areaName}
        onChangeText={setAreaName}
        placeholder="Enter area name"
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.btn}
        onPress={handleAddArea}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Saving...' : 'Add Area'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>All Society</Text>

      {areas?.map(area => (
        <Text key={area.id}>{area.name}</Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: '#2e7dff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default AddArea;
