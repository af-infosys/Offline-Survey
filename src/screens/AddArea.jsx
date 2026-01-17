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
import { useNavigation } from '@react-navigation/native'; // navigation hook

const AddArea = () => {
  const [areaName, setAreaName] = useState('');
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const navigation = useNavigation();

  // 🔹 New State to track if we are editing
  const [editId, setEditId] = useState(null);

  const fetchCachedAreas = async () => {
    try {
      const raw = await AsyncStorage.getItem('cached_areas');
      const cachedAreas = raw ? JSON.parse(raw) : [];
      setAreas(cachedAreas);
    } catch (e) {
      console.log('Error fetching areas', e);
    }
  };

  // 🔹 Handle Save (Add New OR Update Existing)
  const handleSaveArea = async () => {
    if (!areaName.trim()) {
      Alert.alert('Error', 'Area name is empty');
      return;
    }

    setLoading(true);

    try {
      const raw = await AsyncStorage.getItem('cached_areas');
      let cachedAreas = raw ? JSON.parse(raw) : [];

      // CASE 1: EDITING Existing Offline Item
      if (editId) {
        const updatedAreas = cachedAreas.map(item => {
          if (item.id === editId) {
            return { ...item, name: areaName.trim() }; // Update name only
          }
          return item;
        });

        await AsyncStorage.setItem(
          'cached_areas',
          JSON.stringify(updatedAreas),
        );
        setAreas(updatedAreas);

        // Reset Form
        setAreaName('');
        setEditId(null);
        Alert.alert('Updated', 'Offline area updated');
        setLoading(false);
        return;
      }

      // CASE 2: ADDING New Item
      const net = await NetInfo.fetch();

      const newArea = {
        id: cachedAreas?.length + 1,
        name: areaName.trim(),
        isSynced: false,
      };

      // 🔹 ONLINE → direct API hit
      if (net.isConnected) {
        try {
          const workId = await AsyncStorage.getItem('WORK_ID');

          if (!workId) {
            Alert.alert('Please Refresh the app after login!');
            return;
          }

          const res = await fetch(`${BASE_URL}/api/sheet/areas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ areaName: newArea.name, workId }),
          });

          const json = await res.json();

          if (res.ok && json?.data) {
            newArea.id = json.data.id; // Server ID
            newArea.isSynced = true;
          }

          Alert.alert('Success', 'Area Added on The Internet!');
        } catch (e) {
          // Online fail → offline fallback logic below
          Alert.alert(
            'Offline Mode',
            'Internet issue, saved locally. Connect internet to sync.',
          );
        }
      } else {
        Alert.alert('Offline', 'Area saved locally');
      }

      // Save to Local Storage (whether synced or not)
      const updated = [...cachedAreas, newArea];
      await AsyncStorage.setItem('cached_areas', JSON.stringify(updated));
      setAreas(updated);
      setAreaName('');
    } catch (e) {
      console.log('Add area error', e);
      Alert.alert('Error', 'Area save nahi hua');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 DELETE Function
  const handleDelete = async id => {
    Alert.alert(
      'Delete Area',
      'Kya aap is offline area ko delete karna chahte hain?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = areas.filter(item => item.id !== id);
            setAreas(updated);
            await AsyncStorage.setItem('cached_areas', JSON.stringify(updated));

            // Agar wohi item edit ho raha tha, to form clear karo
            if (editId === id) {
              setAreaName('');
              setEditId(null);
            }
          },
        },
      ],
    );
  };

  // 🔹 START EDIT Function
  const handleEdit = area => {
    setAreaName(area.name);
    setEditId(area.id);
  };

  // 🔹 CANCEL EDIT
  const handleCancelEdit = () => {
    setAreaName('');
    setEditId(null);
  };

  useEffect(() => {}, []);

  useEffect(() => {
    fetchCachedAreas();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchCachedAreas();
    });

    // 3. Cleanup: Jab screen destroy ho, toh listener hata dein
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.box}>
      <Text style={styles.title}>
        {editId ? 'Edit Offline Area' : 'Add New Society'}
      </Text>

      <TextInput
        value={areaName}
        onChangeText={setAreaName}
        placeholder="Enter area name"
        style={styles.input}
      />

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.btn, styles.saveBtn]}
          onPress={handleSaveArea}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? 'Saving...' : editId ? 'Update Area' : 'Add Area'}
          </Text>
        </TouchableOpacity>

        {/* Show Cancel button only when editing */}
        {editId && (
          <TouchableOpacity
            style={[styles.btn, styles.cancelBtn]}
            onPress={handleCancelEdit}
          >
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />

      <Text style={styles.title}>All Societies</Text>

      <ScrollView style={{ maxHeight: 300 }}>
        {areas?.map((area, index) => (
          <View key={index} style={styles.areaItem}>
            <View style={styles.areaInfo}>
              <Text style={styles.areaName}>{area.name}</Text>
              <Text
                style={[
                  styles.statusText,
                  { color: area.isSynced ? 'green' : 'orange' },
                ]}
              >
                {area.isSynced ? '● Synced' : '● Offline'}
              </Text>
            </View>

            {/* 🔹 ACTION BUTTONS (Only if NOT synced) */}
            {!area.isSynced && (
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => handleEdit(area)}
                  style={styles.actionBtn}
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(area.id)}
                  style={styles.actionBtn}
                >
                  <Text style={styles.delText}>Del</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  saveBtn: {
    backgroundColor: '#2e7dff',
  },
  cancelBtn: {
    backgroundColor: '#999',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },

  // List Styles
  areaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  areaInfo: {
    flex: 1,
  },
  areaName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statusText: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionBtn: {
    padding: 4,
  },
  editText: {
    color: '#2e7dff',
    fontWeight: '600',
  },
  delText: {
    color: 'red',
    fontWeight: '600',
  },
});

export default AddArea;
