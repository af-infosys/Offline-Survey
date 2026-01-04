import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
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
    <View style={styles.dropdownContainer}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setVisible(true)}
      >
        <Text
          style={[styles.dropdownButtonText, !value && styles.placeholderText]}
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
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {placeholder || 'Select Option'}
            </Text>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    item.value === value && styles.modalItemSelected,
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      item.value === value && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// --- 2. Main Floor Details Component ---

const FloorDetails = ({ floors, setFloors }) => {
  // Helper function mock
  const convertGujaratiToEnglishDigits = val =>
    val.replace(/[૦-૯]/g, d => '૦૧૨૩૪૫૬૭૮૯'.indexOf(d));

  // --- Functions ---
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
        ? convertGujaratiToEnglishDigits(value)
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Text style={styles.sectionTitle}>9. માળની વિગતો *</Text>

      <View style={styles.floorsContainer}>
        {floors.map((floor, floorIndex) =>
          floor.floorType === 'ફળિયું' ? null : (
            <View key={floorIndex} style={styles.floorSection}>
              {/* Floor Header */}
              <View style={styles.headerRow}>
                <Text style={styles.floorTitle}>
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
                <View key={roomIndex} style={styles.roomSection}>
                  {/* Room Header */}
                  <View style={styles.headerRow}>
                    <Text style={styles.roomTitle}>
                      વર્ણન : {roomIndex + 1} *
                    </Text>
                    {floor.roomDetails.length > 1 && (
                      <TouchableOpacity
                        style={styles.deleteBtnTextWrapper}
                        onPress={() => deleteRoomDetails(floorIndex, roomIndex)}
                      >
                        <TrashIcon size={18} color="#dc2626" />
                        <Text style={styles.deleteText}>Delete</Text>
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
                  <View style={styles.gridRow}>
                    {[
                      { label: 'સ્લેબ', name: 'slabRooms' },
                      { label: 'પતરા', name: 'tinRooms' },
                      { label: 'પીઢીયા', name: 'woodenRooms' },
                      { label: 'નળીયા', name: 'tileRooms' },
                    ].map(item => (
                      <View key={item.name} style={styles.smallInputGroup}>
                        <Text style={styles.smallLabel}>{item.label}</Text>
                        <TextInput
                          style={styles.smallInput}
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
                style={styles.addRoomButton}
              >
                <PlusIcon />
                <Text style={styles.addRoomText}>વધુ વર્ણન ઉમેરો</Text>
              </TouchableOpacity>
            </View>
          ),
        )}

        {/* Add Floor Button */}
        <TouchableOpacity onPress={addFloor} style={styles.addFloorButton}>
          <PlusIcon color="#4b5563" />
          <Text style={styles.addFloorText}>વધુ માળ ઉમેરો</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    marginTop: 10,
  },
  addFloorText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4b5563',
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
});

export default FloorDetails;
