import React, { useState, useEffect, cache } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import SQLite from 'react-native-sqlite-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BASE_URL from '../../config';

import Svg, { Path } from 'react-native-svg';

// --- 1. Custom Dropdown Component (No Library Needed) ---
const CustomDropdown = ({ value, options, onSelect, placeholder, label }) => {
  const [visible, setVisible] = useState(false);

  const selectedLabel = options.find(opt => opt.value === value)?.label;

  const handleSelect = val => {
    onSelect(val);
    setVisible(false);
  };

  return (
    <View style={floorstyles.dropdownContainer}>
      {label && <Text style={floorstyles.label}>{label}</Text>}

      <TouchableOpacity
        style={floorstyles.dropdownButton}
        onPress={() => setVisible(true)}
      >
        <Text
          style={[
            floorstyles.dropdownButtonText,
            !value && floorstyles.placeholderText,
          ]}
        >
          {selectedLabel || placeholder || 'Select'}
        </Text>
        {/* Down Arrow Icon */}
        <Svg width={12} height={12} viewBox="0 0 20 20" fill="gray">
          <Path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </Svg>
      </TouchableOpacity>

      <Modal transparent={true} visible={visible} animationType="fade">
        <TouchableOpacity
          style={floorstyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={floorstyles.modalContent}>
            <Text style={floorstyles.modalTitle}>
              {placeholder || 'Select Option'}
            </Text>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    floorstyles.modalItem,
                    item.value === value && floorstyles.modalItemSelected,
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text
                    style={[
                      floorstyles.modalItemText,
                      item.value === value && floorstyles.modalItemTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={floorstyles.modalCloseButton}
              onPress={() => setVisible(false)}
            >
              <Text style={floorstyles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const db = SQLite.openDatabase(
  { name: 'SurveyOffline.db', location: 'default' },
  () => {},
  err => console.log('DB Error', err),
);

const SurveyFormApp = ({ navigation }) => {
  // --- Initial States ---
  const initialFormState = {
    serialNumber: '',
    areaName: '',
    propertyNumber: '',
    ownerName: '',
    oldPropertyNumber: '',
    mobileNumber: '',
    propertyNameOnRecord: '',
    houseCategory: '',
    kitchenCount: '0',
    bathroomCount: '0',
    verandaCount: '0',
    tapCount: '0',
    toiletCount: '0',
    remarks: '',
    bp: false,
    landArea: false,
  };

  const initialFloorsState = [
    {
      floorType: '',
      roomDetails: [
        {
          type: '',
          roomHallShopGodown: '',
          slabRooms: '',
          tinRooms: '',
          woodenRooms: '',
          tileRooms: '',
        },
      ],
    },
  ];

  const WORK_ID_KEY = 'WORK_ID';
  const NEXT_SERIAL_KEY = 'NEXT_SERIAL';

  const [formData, setFormData] = useState(initialFormState);
  const [floors, setFloors] = useState(initialFloorsState);
  const [areas, setAreas] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [searchArea, setSearchArea] = useState('');

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [searchCategory, setSearchCategory] = useState('');

  const [workSpot, setWorkSpot] = useState({});

  const [user, setUser] = useState({});

  const categories = [
    'રહેણાંક - મકાન',
    'દુકાન',
    'ધાર્મિક સ્થળ',
    'સરકારી મિલ્ક્ત',
    'પ્રાઈવેટ - સંસ્થાઓ',
    'પ્લોટ ખાનગી - ખુલ્લી જગ્યા',
    'પ્લોટ સરકારી - કોમનપ્લોટ',
    'કારખાના - ઇન્ડસ્ટ્રીજ઼',
    'ટ્રસ્ટ મિલ્કત / NGO',
    'મંડળી - સેવા સહકારી મંડળી',
    'બેંક - સરકારી',
    'બેંક - અર્ધ સરકારી બેંક',
    'બેંક - પ્રાઇટ બેંક',
    'સરકારી સહાય આવાસ',
    'કોમ્પપ્લેક્ષ',
    'હિરાના કારખાના નાના',
    'હિરાના કારખાના મોટા',
    'મોબાઈલ ટાવર',
    'પેટ્રોલ પંપ, ગેસ પંપ',
  ];

  // --- Utilities ---
  const convertGujToEng = input => {
    if (!input) return '';
    const gujaratiDigits = '૦૧૨૩૪૫૬૭૮૯';
    const englishDigits = '0123456789';
    return input
      .toString()
      .replace(
        /[૦૧૨૩૪૫૬૭૮૯]/g,
        char => englishDigits[gujaratiDigits.indexOf(char)],
      );
  };

  async function fetchUser() {
    await AsyncStorage.getItem('user').then(user_data => {
      setUser(JSON.parse(user_data));
      console.log('user_data', user_data);
    });
  }

  // --- Lifecycle & Data Fetching ---
  // useEffect(() => {
  //   fetchUser();
  //   syncWorkId();

  //   // DB Initialize
  //   db.transaction(tx => {
  //     tx.executeSql(
  //       'CREATE TABLE IF NOT EXISTS surveys (id INTEGER PRIMARY KEY AUTOINCREMENT, formData TEXT, floors TEXT, isSynced INTEGER DEFAULT 0, createdAt TEXT)',
  //     );
  //   });

  //   const unsubscribe = NetInfo.addEventListener(state => {
  //     setIsOffline(!state.isConnected);
  //     if (state.isConnected) {
  //       fetchMetadata();
  //     } else {
  //       loadCachedMetadata();
  //     }
  //   });

  //   return () => unsubscribe();
  // }, []);

  const fetchMetadata = async () => {
    try {
      // 1️⃣ Local storage se uthao
      const localRaw = await AsyncStorage.getItem('cached_areas');
      let localAreas = localRaw ? JSON.parse(localRaw) : [];

      // UI ko pehle hi kuch dikha do
      if (localAreas.length) {
        setAreas(localAreas);
      }

      const net = await NetInfo.fetch();
      if (!net.isConnected) return;

      // 2️⃣ Offline-added areas (jinme isSynced false hai)
      const unsyncedAreas = localAreas.filter(a => a.isSynced === false);

      for (const area of unsyncedAreas) {
        try {
          const res = await fetch(`${BASE_URL}/api/sheet/areas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: area.name, // sirf name bhejna hai
            }),
          });

          if (res.ok) {
            area.isSynced = true;
          }
        } catch (err) {
          console.log('area sync failed:', area.name);
        }
      }

      // 3️⃣ Ab server se final truth lao
      const response = await fetch(`${BASE_URL}/api/sheet/areas`);
      const result = await response.json();

      if (Array.isArray(result?.data)) {
        /**
         * Expecting server data like:
         * [{ id, name }]
         */
        setAreas(result.data);

        await AsyncStorage.setItem(
          'cached_areas',
          JSON.stringify(
            result.data.map(a => ({
              ...a,
              isSynced: true,
            })),
          ),
        );
      }
    } catch (e) {
      const cached = await AsyncStorage.getItem('cached_areas');
      if (cached) {
        setAreas(JSON.parse(cached));
      }
    }
  };

  const loadCachedMetadata = async () => {
    const cached = await AsyncStorage.getItem('cached_areas');
    console.log('cached', cached);
    if (cached) setAreas(JSON.parse(cached));
  };

  // const fetchOnlineIndex = async () => {
  //   try {
  //     const response = await fetch(`${BASE_URL}/api/sheet`);
  //     const result = await response.json();
  //     const data = result?.data;

  //     if (data && data.length > 0) {
  //       const lastSerial = Number(data[data.length - 1][0]);
  //       setFormData(prev => ({
  //         ...prev,
  //         serialNumber: (lastSerial + 1).toString(),
  //         propertyNumber: (lastSerial + 1).toString(),
  //       }));
  //     }
  //   } catch (err) {
  //     console.log('Error fetching index', err);
  //   }
  // };

  // NEwwww Logic

  /* =======================
     1️⃣ INITIAL DB SETUP
     ======================= */
  useEffect(() => {
    fetchUser();
    fetchMetadata();

    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS surveys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          formData TEXT,
          floors TEXT,
          isSynced INTEGER DEFAULT 0,
          createdAt TEXT
        )`,
      );
    });

    initWorkAndSerial();
  }, []);

  /* =======================
     2️⃣ MASTER INIT FLOW
     ======================= */
  const initWorkAndSerial = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('user');
      if (!userDataStr) return;

      setWorkSpot(JSON.parse(await AsyncStorage.getItem('workSpot')));

      const user_data = JSON.parse(userDataStr);
      console.log('user id', user_data.id);

      let fetchedWorkId = '';
      let isNalla = false;

      const net = await NetInfo.fetch();

      // =====================
      // 🌐 ONLINE MODE
      // =====================
      if (net.isConnected) {
        try {
          const res = await fetch(`${BASE_URL}/api/work/${user_data.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await AsyncStorage.getItem(
                'userToken',
              )}`,
            },
          });

          const data = await res.json();
          console.log('work api data', data);

          if (data?.nalla) {
            isNalla = true;
            await clearAllLocalData();
            setWorkSpot({});
            return;
          }

          fetchedWorkId = data?.work?._id || '';

          if (data?.work?.spot) {
            setWorkSpot(data.work.spot);
            await AsyncStorage.setItem(
              'workSpot',
              JSON.stringify(data.work.spot),
            );
          }
        } catch (err) {
          console.log('Online work fetch failed', err);
        }
      }

      // =====================
      // 📴 OFFLINE MODE
      // =====================
      if (!fetchedWorkId) {
        fetchedWorkId = await AsyncStorage.getItem('WORK_ID');
        console.log('offline work id', fetchedWorkId);
      }

      // =====================
      // 🔁 SYNC WORK ID
      // =====================
      await syncWorkId(fetchedWorkId, isNalla);

      // =====================
      // 🔢 SERIAL NUMBER
      // =====================
      const nextSerial = await getNextSerialNumber();
      console.log('nextSerial', nextSerial);

      if (!nextSerial) return;

      setFormData(prev => ({
        ...prev,
        serialNumber: nextSerial.toString(),
        propertyNumber: nextSerial.toString(),
      }));
    } catch (e) {
      console.log('initWorkAndSerial fatal error', e);
    }
  };

  /* =======================
     3️⃣ WORK ID LOGIC
     ======================= */
  const syncWorkId = async (fetchedWorkId, nalla) => {
    const storedWorkId = await AsyncStorage.getItem(WORK_ID_KEY);
    console.log(storedWorkId, fetchedWorkId, nalla);

    if (!fetchedWorkId && !nalla) {
      if (!storedWorkId) {
        Alert.alert(
          'Please Connect to Internet!',
          'Reopen the App, and Try Again',
        );
      }

      return;
    }

    // only check if network mode is online
    const net = await NetInfo.fetch();
    if (net.isConnected) {
      // ONLINE MODE

      // first time
      if (!storedWorkId) {
        await AsyncStorage.setItem(WORK_ID_KEY, fetchedWorkId);
        await resetSerialIndex();
        return;
      }

      // village / work change
      if (!nalla) {
        if (storedWorkId !== fetchedWorkId) {
          await clearAllLocalData();
          await AsyncStorage.setItem(WORK_ID_KEY, fetchedWorkId);
          await resetSerialIndex();
        }
      }

      return;
    }
  };

  /* =======================
     4️⃣ SERIAL NUMBER SOURCE
     ======================= */
  const getNextSerialNumber = async () => {
    const stored = await AsyncStorage.getItem(NEXT_SERIAL_KEY);
    console.log('stored', stored);

    if (stored !== null) {
      return Number(stored);
    }

    const net = await NetInfo.fetch();
    if (net.isConnected) {
      const online = await fetchOnlineIndex();
      if (online !== null) {
        await AsyncStorage.setItem(NEXT_SERIAL_KEY, online.toString());
        return online;
      }
    }

    Alert.alert('Please Connect to Internet and Reopen the App!');

    // const local = await getMaxSerialFromSQLite();
    // if (local !== null) return local + 1;

    return null;
  };

  /* =======================
     5️⃣ ONLINE INDEX
     ======================= */
  const fetchOnlineIndex = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/sheet`);
      const json = await res.json();
      const data = json?.data;

      if (data?.length) {
        const last = Number(data[data.length - 1][0]);
        return last + 1;
      }
    } catch (e) {
      console.log('Online index error', e);
    }
    return null;
  };

  /* =======================
     6️⃣ SQLITE FALLBACK
     ======================= */
  const getMaxSerialFromSQLite = () =>
    new Promise(resolve => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT MAX(serialNumber) as max FROM surveys',
          [],
          (_, res) => {
            const max = res.rows.item(0)?.max;
            resolve(max !== null ? Number(max) : null);
          },
        );
      });
    });

  /* =======================
     7️⃣ RESET / CLEAR HELPERS
     ======================= */
  const resetSerialIndex = async () => {
    await AsyncStorage.removeItem(NEXT_SERIAL_KEY);
  };

  const clearAllLocalData = async () => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM surveys');
    });

    await AsyncStorage.multiRemove([
      WORK_ID_KEY,
      NEXT_SERIAL_KEY,
      'cached_areas',
    ]);
  };

  // --- Change Handlers ---
  const handleChange = (name, value) => {
    let processedValue = value;
    if (
      name !== 'ownerName' &&
      name !== 'remarks' &&
      name !== 'propertyNameOnRecord'
    ) {
      processedValue = convertGujToEng(value);
    }

    if (name === 'landArea') {
      if (value === true) {
        setFloors([
          ...floors,
          {
            floorType: 'ફળિયું',
            roomDetails: [initialFloorsState[0].roomDetails[0]],
          },
        ]);
      } else {
        setFloors(floors.filter(f => f.floorType !== 'ફળિયું'));
      }
      setFormData(prev => ({ ...prev, landArea: value }));
      return;
    }

    if (name === 'bp') {
      const remarkPrefix = 'બિ.પ. ';
      let newRemarks = formData.remarks;
      if (value) {
        newRemarks = remarkPrefix + newRemarks;
      } else {
        newRemarks = newRemarks.replace(remarkPrefix, '');
      }
      setFormData(prev => ({ ...prev, bp: value, remarks: newRemarks.trim() }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const deleteFloor = floorIndex => {
    Alert.alert('Confirm', 'Sure to Delete?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'OK',
        onPress: () => {
          setFloors(prevFloors =>
            prevFloors.filter((_, i) => i !== floorIndex),
          );
        },
      },
    ]);
  };

  const deleteRoomDetails = (floorIndex, roomIndex) => {
    Alert.alert('Confirm', 'Sure to Delete?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'OK',
        onPress: () => {
          setFloors(prevFloors => {
            const newFloors = [...prevFloors];
            const newRoomDetails = newFloors[floorIndex].roomDetails.filter(
              (_, i) => i !== roomIndex,
            );
            newFloors[floorIndex] = {
              ...newFloors[floorIndex],
              roomDetails: newRoomDetails,
            };
            return newFloors;
          });
        },
      },
    ]);
  };

  const handleRoomDetailsChange = (floorIndex, roomIndex, name, value) => {
    const processedValue =
      name !== 'roomHallShopGodown' && name !== 'type'
        ? convertGujToEng(value)
        : value;

    setFloors(prevFloors => {
      const newFloors = [...prevFloors];
      newFloors[floorIndex].roomDetails[roomIndex] = {
        ...newFloors[floorIndex].roomDetails[roomIndex],
        [name]: processedValue,
      };
      return newFloors;
    });
  };

  const addFloor = () => {
    setFloors(prevFloors => [
      ...prevFloors,
      {
        floorType: '',
        roomDetails: [
          {
            type: '',
            roomHallShopGodown: '',
            slabRooms: '',
            tinRooms: '',
            woodenRooms: '',
            tileRooms: '',
          },
        ],
      },
    ]);
  };

  const addRoomDetails = floorIndex => {
    setFloors(prevFloors => {
      const newFloors = [...prevFloors];
      newFloors[floorIndex].roomDetails.push({
        type: '',
        roomHallShopGodown: '',
        slabRooms: '',
        tinRooms: '',
        woodenRooms: '',
        tileRooms: '',
      });
      return newFloors;
    });
  };

  const handleFloorTypeChange = (floorIndex, value) => {
    setFloors(prevFloors => {
      const newFloors = [...prevFloors];
      newFloors[floorIndex] = {
        ...newFloors[floorIndex],
        floorType: value,
      };
      return newFloors;
    });
  };

  // --- Data Options for Dropdowns ---
  const floorOptions = [
    { label: 'ગ્રાઉન્ડ ફ્લોર', value: 'ગ્રાઉન્ડ ફ્લોર' },
    { label: 'પ્રથમ માળ', value: 'પ્રથમ માળ' },
    { label: 'બીજો માળ', value: 'બીજો માળ' },
    { label: 'ત્રીજો માળ', value: 'ત્રીજો માળ' },
    { label: 'ચોથો માળ', value: 'ચોથો માળ' },
    { label: 'પાંચમો માળ', value: 'પાંચમો માળ' },
  ];

  const typeOptions = [
    { label: 'પાકા', value: 'પાકા' },
    { label: 'કાચા', value: 'કાચા' },
    { label: 'પ્લોટ', value: 'પ્લોટ' },
  ];

  const roomTypeOptions = [
    { label: 'રૂમ (Room)', value: 'રૂમ' },
    { label: 'હોલ નાનો', value: 'હોલ નાનો' },
    { label: 'હોલ મોટો', value: 'હોલ મોટો' },
    { label: 'દુકાન નાની', value: 'દુકાન નાની' },
    { label: 'દુકાન મોટી', value: 'દુકાન મોટી' },
    { label: 'ગોડાઉન નાનું', value: 'ગોડાઉન નાનું' },
    { label: 'ગોડાઉન મોટું', value: 'ગોડાઉન મોટું' },
    { label: 'ઢાળિયું', value: 'ઢાળિયું' },
    { label: 'કેબિન', value: 'કેબિન' },
    { label: 'પાળું', value: 'પાળું' },
    { label: 'શેડ નાના પતરાવાળા', value: 'શેડ નાના પતરાવાળા' },
    { label: 'શેડ મોટા પતરાવાળા', value: 'શેડ મોટા પતરાવાળા' },
    { label: 'પ્લોટ', value: 'પ્લોટ' },
  ];

  // --- Icons ---
  const TrashIcon = ({ size = 24, color = 'black' }) => (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
    </Svg>
  );

  const PlusIcon = ({ size = 20, color = 'white' }) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill={color}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
      />
    </Svg>
  );

  // --- Submit Handler ---
  const handleSave = async () => {
    if (!formData.ownerName || !formData.areaName) {
      Alert.alert('Error', 'માલિકનું નામ અને વિસ્તાર ફરજિયાત છે!');
      return;
    }

    const finalData = {
      ...formData,
      survayor: { id: user?.id, name: user?.name, time: new Date() },
    };
    console.log(finalData);

    db.transaction(
      tx => {
        tx.executeSql(
          'INSERT INTO surveys (formData, floors, isSynced, createdAt) VALUES (?, ?, ?, ?)',
          [
            JSON.stringify(finalData),
            JSON.stringify(floors ?? []),
            0,
            new Date().toISOString(),
          ],

          async (_, res) => {
            console.log('INSERT OK', res);

            setFormData(initialFormState);
            setFloors(initialFloorsState);

            await AsyncStorage.setItem(
              NEXT_SERIAL_KEY,
              (Number(formData?.serialNumber) + 1).toString(),
            );
            const result = await AsyncStorage.getItem(NEXT_SERIAL_KEY);

            setFormData(prev => ({
              ...prev,
              serialNumber: result?.toString(),
              propertyNumber: result?.toString(),
            }));

            Alert.alert('Success ✅', 'Saved');
            navigation.navigate('Report');
          },
          (_, err) => {
            console.log('SQL ERROR FULL', err);
            Alert.alert('SQL Error', JSON.stringify(err));
            return true;
          },
        );
      },
      err => {
        console.log('TRANSACTION ERROR', err);
        Alert.alert('Txn Error', JSON.stringify(err));
      },
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.mainTitle}>સર્વે ફોર્મ</Text>
        {/* <View
          style={[
            styles.statusBadge,
            { backgroundColor: isOffline ? '#FF5252' : '#4CAF50' },
          ]}
        >
          <Text style={styles.statusText}>
            {isOffline ? 'Offline Mode' : 'Online Mode'}
          </Text>
        </View> */}
      </View>

      {/* workSpot */}

      <View style={styles.workSpotCard}>
        <Text style={styles.workSpotTitle}>ગામ: {workSpot?.gaam || '-'}</Text>
        <Text style={styles.workSpotTitle}>
          તાલુકો: {workSpot?.taluka || '-'}
        </Text>
        <Text style={styles.workSpotTitle}>
          જિલ્લો: {workSpot?.district || '-'}
        </Text>
      </View>

      {/* Basic Info Card */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>1. અનું ક્રમાંક</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.serialNumber}
              editable={false}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.label}>3. મિલ્કત ક્રમાંક</Text>
            <TextInput
              style={styles.input}
              value={formData.propertyNumber}
              onChangeText={v => handleChange('propertyNumber', v)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.label}>2. વિસ્તાર *</Text>
        <TouchableOpacity
          style={modalStyles.inputContainer}
          onPress={() => setShowAreaModal(true)}
        >
          <TextInput
            style={[modalStyles.input, { marginBottom: 0, borderWeight: 0 }]}
            placeholder="વિસ્તાર પસંદ કરો"
            value={formData.areaName}
            editable={false} // टाइप नहीं करने देना, सिर्फ क्लिक
            pointerEvents="none" // क्लिक सीधा TouchableOpacity पर जाए
          />
          <Icon
            name="chevron-down"
            size={20}
            color="#666"
            style={modalStyles.dropdownIcon}
          />
        </TouchableOpacity>

        {/* --- Area Selection Modal --- */}
        <Modal
          visible={showAreaModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAreaModal(false)}
        >
          <View style={modalStyles.modalOverlay}>
            <View style={modalStyles.modalContent}>
              <View style={modalStyles.modalHeader}>
                <Text style={modalStyles.modalTitle}>વિસ્તાર પસંદ કરો</Text>
                <TouchableOpacity onPress={() => setShowAreaModal(false)}>
                  <Icon name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={modalStyles.searchInput}
                placeholder="શોધો..."
                onChangeText={text => setSearchArea(text)}
              />

              <FlatList
                data={areas?.filter(a => a.name.includes(searchArea))}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={modalStyles.areaItem}
                    onPress={() => {
                      handleChange('areaName', item.name);
                      setShowAreaModal(false);
                    }}
                  >
                    <Text style={modalStyles.areaItemText}>
                      {item.id}. {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <Text style={styles.label}>4. માલિકનું નામ *</Text>
        <TextInput
          style={styles.input}
          placeholder="માલિકનું નામ"
          value={formData.ownerName}
          onChangeText={v => handleChange('ownerName', v)}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>5. જુનો મિલકત નંબર</Text>
            <TextInput
              style={styles.input}
              value={formData.oldPropertyNumber}
              onChangeText={v => handleChange('oldPropertyNumber', v)}
              keyboardType="numeric"
            />
          </View>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.label}>6. મોબાઈલ નંબર</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              value={formData.mobileNumber}
              onChangeText={v => handleChange('mobileNumber', v)}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        <Text style={styles.label}>
          7. મિલ્ક્ત પર લખેલ નામ (મકાન/દુકાન/કારખાના/કંપનીનું નામ)
        </Text>
        <TextInput
          style={styles.input}
          placeholder=""
          value={formData.propertyNameOnRecord}
          onChangeText={v => handleChange('propertyNameOnRecord', v)}
        />

        <Text style={styles.label}>8. મકાન category *</Text>
        <TouchableOpacity
          style={modalStyles.inputContainer}
          onPress={() => setShowCategoryModal(true)}
        >
          <TextInput
            style={[modalStyles.input, { marginBottom: 0, borderWeight: 0 }]}
            placeholder="કેટેગરી પસંદ કરો"
            value={formData.houseCategory}
            editable={false}
            pointerEvents="none"
          />
          <Icon
            name="chevron-down"
            size={20}
            color="#666"
            style={modalStyles.dropdownIcon}
          />
        </TouchableOpacity>

        {/* --- Area Selection Modal --- */}
        <Modal
          visible={showCategoryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={modalStyles.modalOverlay}>
            <View style={modalStyles.modalContent}>
              <View style={modalStyles.modalHeader}>
                <Text style={modalStyles.modalTitle}>કેટેગરી પસંદ કરો</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <Icon name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {/* सर्च बार (अगर लिस्ट बड़ी है तो) */}
              <TextInput
                style={modalStyles.searchInput}
                placeholder="શોધો..."
                onChangeText={text => setSearchCategory(text)}
              />

              <FlatList
                data={categories.filter(a => a.includes(searchCategory))}
                keyExtractor={item => item.toString()}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={modalStyles.areaItem}
                    onPress={() => {
                      handleChange('houseCategory', item);
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text style={modalStyles.areaItemText}>
                      {index + 1}. {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>

      {/* Floors Section */}
      <Text style={floorstyles.sectionTitle}>9. માળની વિગતો *</Text>

      <View style={floorstyles.floorsContainer}>
        {floors.map((floor, floorIndex) =>
          floor.floorType === 'ફળિયું' ? null : (
            <View key={floorIndex} style={floorstyles.floorSection}>
              {/* Floor Header */}
              <View style={floorstyles.headerRow}>
                <Text style={floorstyles.floorTitle}>
                  માળ:{' '}
                  <Text style={{ fontWeight: 'normal' }}>
                    {floor.floorType || `માળ ${floorIndex + 1}`}
                  </Text>
                </Text>

                {floors.length > 1 && (
                  <TouchableOpacity onPress={() => deleteFloor(floorIndex)}>
                    <TrashIcon color="#dc2626" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Floor Type Select (Using CustomDropdown) */}
              <CustomDropdown
                label="માળનો પ્રકાર *"
                placeholder="માળ પસંદ કરો"
                options={floorOptions}
                value={floor.floorType}
                onSelect={val => handleFloorTypeChange(floorIndex, val)}
              />

              {/* Room Details Loop */}
              {floor.roomDetails.map((room, roomIndex) => (
                <View key={roomIndex} style={floorstyles.roomSection}>
                  {/* Room Header */}
                  <View style={floorstyles.headerRow}>
                    <Text style={floorstyles.roomTitle}>
                      વર્ણન : {roomIndex + 1} *
                    </Text>
                    {floor.roomDetails.length > 1 && (
                      <TouchableOpacity
                        style={floorstyles.deleteBtnTextWrapper}
                        onPress={() => deleteRoomDetails(floorIndex, roomIndex)}
                      >
                        <TrashIcon size={18} color="#dc2626" />
                        <Text style={floorstyles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Room Type Select */}
                  <CustomDropdown
                    label="પ્રકાર"
                    placeholder="Select"
                    options={typeOptions}
                    value={room.type}
                    onSelect={val =>
                      handleRoomDetailsChange(
                        floorIndex,
                        roomIndex,
                        'type',
                        val,
                      )
                    }
                  />

                  {/* 4 Number Inputs Row */}
                  <View style={floorstyles.gridRow}>
                    {[
                      { label: 'સ્લેબ', name: 'slabRooms' },
                      { label: 'પતરા', name: 'tinRooms' },
                      { label: 'પીઢીયા', name: 'woodenRooms' },
                      { label: 'નળીયા', name: 'tileRooms' },
                    ].map(item => (
                      <View key={item.name} style={floorstyles.smallInputGroup}>
                        <Text style={floorstyles.smallLabel}>{item.label}</Text>
                        <TextInput
                          style={floorstyles.smallInput}
                          keyboardType="numeric"
                          value={String(room[item.name] || '')}
                          onChangeText={text =>
                            handleRoomDetailsChange(
                              floorIndex,
                              roomIndex,
                              item.name,
                              text,
                            )
                          }
                          maxLength={3}
                        />
                      </View>
                    ))}
                  </View>

                  {/* Room/Hall/Shop Select */}
                  <CustomDropdown
                    label="રૂમ હોલ દુકાન ગોડાઉન"
                    placeholder="Select"
                    options={roomTypeOptions}
                    value={room.roomHallShopGodown}
                    onSelect={val =>
                      handleRoomDetailsChange(
                        floorIndex,
                        roomIndex,
                        'roomHallShopGodown',
                        val,
                      )
                    }
                  />
                </View>
              ))}

              {/* Add Room Details Button */}
              <TouchableOpacity
                onPress={() => addRoomDetails(floorIndex)}
                style={floorstyles.addRoomButton}
              >
                <PlusIcon />
                <Text style={floorstyles.addRoomText}>વધુ વર્ણન ઉમેરો</Text>
              </TouchableOpacity>
            </View>
          ),
        )}

        {/* Add Floor Button */}
        <TouchableOpacity onPress={addFloor} style={floorstyles.addFloorButton}>
          <PlusIcon />
          <Text style={floorstyles.addFloorText}>વધુ માળ ઉમેરો</Text>
        </TouchableOpacity>
      </View>

      {/* Checkboxes */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>10. ફળિયું (ખુલ્લી જગ્યા)</Text>
          <Switch
            value={formData.landArea}
            onValueChange={v => handleChange('landArea', v)}
          />
        </View>
        <View style={[styles.rowBetween, { marginTop: 10 }]}>
          <Text style={styles.label}>11. બિ.પ.</Text>
          <Switch
            value={formData.bp}
            onValueChange={v => handleChange('bp', v)}
          />
        </View>
      </View>

      {/* Additional Counts */}
      <View style={[styles.card, styles.row]}>
        <View style={styles.countItem}>
          <Text>રસોડું</Text>
          <TextInput
            style={styles.countInput}
            keyboardType="numeric"
            onChangeText={v => handleChange('kitchenCount', v)}
          />
        </View>

        <View style={styles.countItem}>
          <Text>બાથરૂમ</Text>
          <TextInput
            style={styles.countInput}
            keyboardType="numeric"
            onChangeText={v => handleChange('bathroomCount', v)}
          />
        </View>

        <View style={styles.countItem}>
          <Text>ફરજો</Text>
          <TextInput
            style={styles.countInput}
            keyboardType="numeric"
            onChangeText={v => handleChange('verandaCount', v)}
          />
        </View>

        <View style={styles.countItem}>
          <Text>નળ</Text>
          <TextInput
            style={styles.countInput}
            keyboardType="numeric"
            onChangeText={v => handleChange('tapCount', v)}
          />
        </View>

        <View style={styles.countItem}>
          <Text>શોચાલ્ય</Text>
          <TextInput
            style={styles.countInput}
            keyboardType="numeric"
            onChangeText={v => handleChange('toiletCount', v)}
          />
        </View>
      </View>

      {/* Remarks */}
      <View style={styles.card}>
        <Text style={styles.label}>17. નોંધ/રીમાર્કસ</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          numberOfLines={3}
          value={formData.remarks}
          onChangeText={v => handleChange('remarks', v)}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
        <Text style={styles.submitBtnText}>સેવ કરો (Offline Save)</Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    padding: 12,
    marginTop: 25,
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  card: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    color: '#000',
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    marginBottom: 12,
  },
  disabledInput: { backgroundColor: '#EEE', color: '#777' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  floorCard: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 6,
    borderLeftColor: '#8E44AD',
    marginBottom: 15,
    elevation: 2,
  },
  floorTitle: { fontSize: 16, fontWeight: 'bold', color: '#8E44AD' },
  roomContainer: {
    backgroundColor: '#FFF5F4',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  miniInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    padding: 6,
    textAlign: 'center',
    borderRadius: 6,
    backgroundColor: '#FFF',
    marginHorizontal: 2,
  },
  addButton: {
    backgroundColor: '#8E44AD',
    flexDirection: 'row',
    padding: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
  addButtonSmall: { alignSelf: 'flex-end', padding: 5 },
  addButtonTextSmall: { color: '#8E44AD', fontWeight: 'bold' },
  countItem: { flex: 1, alignItems: 'center' },
  countInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    width: 50,
    textAlign: 'center',
    borderRadius: 5,
    marginTop: 5,
    color: '#000',
  },
  submitBtn: {
    backgroundColor: '#27AE60',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
  },
  submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

const modalStyles = StyleSheet.create({
  // ... बाकी स्टाइल्स ...
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    color: '#000',
    marginBottom: 12,
  },
  dropdownIcon: {
    position: 'absolute',
    right: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchInput: {
    color: '#000',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  areaItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  areaItemText: {
    fontSize: 16,
    color: '#333',
  },
});

const floorstyles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    color: '#000',
  },
  floorsContainer: {
    marginBottom: 20,
  },
  floorSection: {
    marginBottom: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  floorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  roomSection: {
    padding: 16,
    marginVertical: 12,
    backgroundColor: '#ffd7d3',
    borderRadius: 6,
  },
  deleteBtnTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteText: {
    color: '#dc2626',
    marginLeft: 4,
    fontSize: 14,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 16,
    marginTop: 8,
  },
  smallInputGroup: {
    width: '22%',
    alignItems: 'center',
  },
  smallLabel: {
    fontSize: 12,
    marginBottom: 4,
    color: '#374151',
    textAlign: 'center',
  },
  smallInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 8,
    width: '100%',
    backgroundColor: '#fff',
    textAlign: 'center',
    color: '#000',
    height: 40,
  },
  addRoomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8f40bc',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  addRoomText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  addFloorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#1c5acdff',
    borderRadius: 6,
    color: '#fff',
  },
  addFloorText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#fff',
  },
  // --- Styles for Custom Dropdown ---
  dropdownContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '90%',
    maxHeight: '70%',
    padding: 16,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemSelected: {
    backgroundColor: '#eff6ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  modalItemTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#4b5563',
    fontWeight: '600',
  },

  workSpotCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,

    // display flex, justify : space-between
  },
  workSpotTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10,
  },
});

export default SurveyFormApp;
