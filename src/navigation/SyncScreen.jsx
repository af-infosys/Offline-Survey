import React, { useState, useCallback } from 'react';
import {
  Alert,
  Text,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Button,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import SQLite from 'react-native-sqlite-storage';
import BASE_URL from '../../config';

const db = SQLite.openDatabase({
  name: 'SurveyOffline.db',
  location: 'default',
});

const SyncScreen = () => {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const COL_WIDTHS = {
    srNo: 50,
    owner: 140,
    area: 120,
    propNo: 100,
    desc: 180,
    bp: 60,
    mobile: 110,
    category: 120,
    tap: 60,
    toilet: 70,
    status: 100, // Sync Status
  };

  // 🔄 Load data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPendingEntries();
    }, []),
  );

  const loadPendingEntries = () => {
    setDataLoading(true);
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM surveys ORDER BY id DESC',
        [],
        (_, resultSet) => {
          const rows = resultSet.rows;
          const data = [];

          for (let i = 0; i < rows.length; i++) {
            const item = rows.item(i);
            try {
              data.push({
                ...item,
                formData: JSON.parse(item.formData),
                floors: JSON.parse(item.floors),
              });
            } catch (e) {
              console.log('Parse Error', e);
            }
          }
          setPendingList(data);
          setDataLoading(false);
        },
        (_, error) => {
          console.log('SQLite Load Error:', error);
          setDataLoading(false);
        },
      );
    });
  };

  const startSync = async () => {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      Alert.alert('Error', 'સિંક કરવા માટે ઇન્ટરનેટ જરૂરી છે!');
      return;
    }

    // Filter only unsynced records
    const recordsToSync = pendingList
      .filter(item => item.isSynced === 0)
      .sort(
        (a, b) =>
          Number(a.formData.serialNumber) - Number(b.formData.serialNumber),
      );

    if (recordsToSync.length === 0) {
      Alert.alert('Info', 'બધો ડેટા પહેલેથી જ સિંક થયેલો છે.');
      return;
    }

    setLoading(true);

    try {
      const payload = recordsToSync.map(item => ({
        ...item.formData,
        floors: item.floors,
      }));

      // console.log('Uploading Payload:', JSON.stringify(payload));

      const res = await fetch(`${BASE_URL}/api/sheet/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json(); // Assuming backend returns JSON

      if (res.status === 200 || res.ok) {
        // Update local DB status to Synced (1)
        db.transaction(
          tx => {
            recordsToSync.forEach(item => {
              tx.executeSql('UPDATE surveys SET isSynced = 1 WHERE id = ?', [
                item.id,
              ]);
            });
          },
          error => console.log('Transaction Error', error),
          () => {
            // Transaction Success
            setLoading(false);
            loadPendingEntries(); // Refresh UI
            Alert.alert(
              'Success ✅',
              `${recordsToSync.length} રેકોર્ડ્સ સફળતાપૂર્વક અપલોડ થયા!`,
            );
          },
        );
      } else {
        throw new Error(result?.message || 'Server returned error');
      }
    } catch (err) {
      console.log('Sync failed!!:', err);
      setLoading(false);
      Alert.alert('Sync Failed ❌', 'કનેક્શન એરર અથવા સર્વર પ્રોબ્લેમ.');
    }
  };

  // for (let item of pendingList) {
  //   if (item.isSynced) continue;

  //   try {
  //     const payload = {
  //       ...item.formData,
  //       floors: item.floors,
  //     };

  //     console.log(payload);

  //     const res = await fetch(`${BASE_URL}/api/sheet/sync`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(payload),
  //     });

  //     if (res?.data?.success) {
  //       db.transaction(tx => {
  //         tx.executeSql('UPDATE surveys SET isSynced = 1 WHERE id = ?', [
  //           item.id,
  //         ]);
  //       });
  //       return;
  //     }

  //     throw new Error(res?.data?.message || 'Sync failed');
  //   } catch (err) {
  //     console.log('Sync failed for ID:', item.id, err);
  //   }
  // }

  const renderHeader = () => (
    <View>
      {/* Title Header */}
      <View style={styles.headerRow}>
        <HeaderCell width={COL_WIDTHS.srNo} title="અનું" />
        <HeaderCell width={COL_WIDTHS.owner} title="માલિકનું નામ" />
        <HeaderCell width={COL_WIDTHS.area} title="વિસ્તાર" />
        <HeaderCell width={COL_WIDTHS.propNo} title="મિલ્કત નં" />
        <HeaderCell width={COL_WIDTHS.desc} title="વર્ણન" />
        <HeaderCell width={COL_WIDTHS.bp} title="બિ.પ." />
        <HeaderCell width={COL_WIDTHS.mobile} title="મોબાઈલ" />
        <HeaderCell width={COL_WIDTHS.category} title="Category" />
        <HeaderCell width={COL_WIDTHS.tap} title="નળ" />
        <HeaderCell width={COL_WIDTHS.toilet} title="શૌચાલય" />
        <HeaderCell width={COL_WIDTHS.status} title="Status" />
      </View>

      {/* Blue Strip (Web Style) */}
      <View style={styles.blueStrip}>
        {Object.values(COL_WIDTHS).map((width, index) => (
          <Text key={index} style={[styles.blueStripText, { width }]}>
            {index + 1}
          </Text>
        ))}
      </View>
    </View>
  );

  const renderItem = ({ item, index }) => {
    const f = item.formData;
    const isSynced = item.isSynced === 1;

    // Disabled Style Logic
    const rowStyle = [
      styles.dataRow,
      index % 2 === 0 ? styles.rowEven : styles.rowOdd, // Zebra Striping
      isSynced && styles.disabledRow, // Dim opacity if synced
    ];

    return (
      <View style={rowStyle}>
        <Cell width={COL_WIDTHS.srNo} value={f.serialNumber || '-'} centered />
        <Cell width={COL_WIDTHS.owner} value={f.ownerName} />
        <Cell width={COL_WIDTHS.area} value={f.areaName} />
        <Cell width={COL_WIDTHS.propNo} value={f.propertyNumber} />
        <Cell width={COL_WIDTHS.desc} value={f.propertyNameOnRecord} />
        <Cell width={COL_WIDTHS.bp} value={f.bp ? 'હા' : '-'} centered />
        <Cell width={COL_WIDTHS.mobile} value={f.mobileNumber} />
        <Cell width={COL_WIDTHS.category} value={f.houseCategory} />
        <Cell width={COL_WIDTHS.tap} value={f.tapCount} centered />
        <Cell width={COL_WIDTHS.toilet} value={f.toiletCount} centered />

        {/* Status Badge */}
        <View
          style={[
            styles.cell,
            { width: COL_WIDTHS.status, alignItems: 'center' },
          ]}
        >
          {isSynced ? (
            <View style={styles.badgeSynced}>
              <Text style={styles.badgeText}>Uploaded</Text>
            </View>
          ) : (
            <View style={styles.badgePending}>
              <Text style={styles.badgeText}>Pending</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const pendingCount = pendingList.filter(i => i.isSynced === 0).length;

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Offline Sync Manager</Text>
        <Text style={styles.subTitle}>
          બાકી રેકોર્ડ્સ:{' '}
          <Text style={{ color: 'red', fontWeight: 'bold' }}>
            {pendingCount}
          </Text>{' '}
          / કુલ: {pendingList.length}
        </Text>
      </View>

      {dataLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {renderHeader()}
            <FlatList
              data={pendingList}
              keyExtractor={item => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 100 }}
              scrollEnabled={false} // Use parent ScrollView
              ListEmptyComponent={
                <View
                  style={{ padding: 20, width: Dimensions.get('window').width }}
                >
                  <Text style={{ textAlign: 'center', color: '#666' }}>
                    કોઈ ઑફલાઇન રેકોર્ડ મળ્યો નથી.
                  </Text>
                </View>
              }
            />
          </View>
        </ScrollView>
      )}

      {/* Floating Sync Button */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={[
            styles.syncButton,
            (pendingCount === 0 || loading) && styles.disabledButton,
          ]}
          onPress={startSync}
          disabled={pendingCount === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
          ) : (
            <Text style={styles.syncButtonText}>
              ☁️ Sync {pendingCount} Records to Server
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Helper Components ---
const HeaderCell = ({ title, width }) => (
  <View style={[styles.headerCell, { width }]}>
    <Text style={styles.headerText}>{title}</Text>
  </View>
);

const Cell = ({ value, width, centered }) => (
  <View
    style={[
      styles.cell,
      { width, justifyContent: centered ? 'center' : 'flex-start' },
    ]}
  >
    <Text style={styles.cellText}>{value || '-'}</Text>
  </View>
);

// --- Styles (Web Report Style) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 30,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  // Table Header
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    height: 45,
    alignItems: 'center',
  },
  headerCell: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  headerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4b5563',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // Blue Strip
  blueStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgb(59, 130, 246)', // Web Blue
    height: 24,
    alignItems: 'center',
  },
  blueStripText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.3)',
  },
  // Data Rows
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 45,
    alignItems: 'center',
  },
  rowOdd: { backgroundColor: '#ffffff' },
  rowEven: { backgroundColor: '#f3f4f6' }, // Zebra
  disabledRow: {
    backgroundColor: '#e5e7eb', // Darker gray for synced
    opacity: 0.6, // Faded look
  },
  cell: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 12,
    color: '#374151',
  },
  // Badges
  badgeSynced: {
    backgroundColor: '#10B981', // Green
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePending: {
    backgroundColor: '#F59E0B', // Orange/Yellow
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Footer Button
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 5,
  },
  syncButton: {
    backgroundColor: '#2563EB', // Blue
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF', // Gray
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SyncScreen;
