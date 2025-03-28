/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { MD3DarkTheme, MD3LightTheme, Modal, Portal, useTheme } from 'react-native-paper';
import { ServiceUtilaj, useServiceUtilaj } from '../services/ServiceUtilaj';

import { StyleSheet, Alert, View, TouchableOpacity, ScrollView, SafeAreaView, useColorScheme, Platform } from 'react-native';
import DocumentScannerComponent from '../components/DocumentScanner';
import { Text } from 'react-native';
import { Button, Checkbox, Divider, TextInput, List } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { Picker } from '@react-native-picker/picker';
import { Service } from '../components/ServiceTable';
import apiService from '../services/AuthService';
import RNFS from 'react-native-fs';

import { debounce } from 'lodash';



interface AdaugaServiciuModalProps {
    visible: boolean;
    onDismiss: () => void;
    rowData: Service | null;
}

const initialFormData = {
    inventar: '',
    data: new Date(),
    index: '',
    lucrare_detalii: '',
    service_utilaj: '',
    file: {
        uri: '',
        name: '',
        type: '',
    },
    revizie: {
        ulei_motor: false,
        filtru_ulei_motor: false,
        filtru_combustibil: false,
        filtru_aer: false,
        filtru_polen: false,
        filtru_adblue: false,
        filtru_uscator: false,
    },
    revizie1: {
        filtru_cutie: false,
        filtru_ulei_cutie: false,
        ulei_punte: false,
    },
    revizie2: {
        ulei_hidraulic: false,
        filtru_ulei_hidraulic: false,
    },
};

const AdaugaServiciuModal: React.FC<AdaugaServiciuModalProps> = ({ visible, onDismiss, rowData }) => {

    console.log("Row data: ", rowData);


    const theme = useTheme(); // ✅ Folosim tema din PaperProvider

    const utilajId = rowData?.inventar || '';

    const [formData, setFormData] = useState(initialFormData);

    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [services, setServices] = useState<ServiceUtilaj[]>([]);
    // const [selectedService] = useState<string>(formData.service);

    const { findAllServicesOnUtilajId } = useServiceUtilaj();

    useEffect(() => {
        if (rowData) {
            setServices([]); // ✅ Resetează lista de servicii când se schimbă utilajul
            const fetchServices = async () => {
                const servicesList = await findAllServicesOnUtilajId(rowData?.id);
                console.log("🔍 Services list:", servicesList);
                if (servicesList && servicesList.length > 0) {
                    setServices(servicesList);
                }
            };

            fetchServices();
        }
    }, [rowData]);

    useEffect(() => {
        if (visible) {
            const initialFormDat = {
                ...initialFormData,
                inventar: rowData?.inventar || '',
            };
            setFormData(initialFormDat); // ✅ Resetează formularul când modalul devine vizibil
        }
    }, [visible]); // 🔥 Se execută doar când `visible` se schimbă


    // ✅ Funcție generală pentru actualizarea valorilor în formular
    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Funcția debounce pentru întârzierea actualizării stării
    const handleDebouncedChange = debounce((field, value) => {
        handleChange(field, value); // Actualizăm formData doar după o pauză
    }, 300);

    // ✅ Funcție pentru actualizarea checkbox-urilor în secțiuni
    const handleCheckboxChange = (section: keyof typeof formData, field: string) => {
        setFormData((prev) => ({
            ...prev,
            [section]: {
                ...(prev[section] as object),
                [field]: !(prev[section] as any)[field],
            },
        }));
    };

    // ✅ Funcție pentru primirea PDF-ului de la `DocumentScannerScreen`
    const handlePdfGenerated = (pdfPath: any) => {
        setFormData((prev) => ({ ...prev, file: pdfPath }));
        Alert.alert('PDF Atașat', `PDF-ul a fost salvat: ${pdfPath}`);
    };

    // ✅ Funcție de submit
    const handleSubmit = async () => {
        if (!formData.index) {
            Alert.alert('Eroare', 'Introduceți un index valid!');
            return;
        }

        if (!formData.service_utilaj && !formData.lucrare_detalii) {
            Alert.alert('Eroare', 'Introduceți detalii despre lucrare sau selectați un service!');
            return;
        }

        const payload = new FormData();
        payload.append('inventar', formData.inventar);
        payload.append('data', formData.data.toISOString().split('T')[0]); // Trimite doar data, fără ora
        payload.append('index', formData.index);
        payload.append('lucrare_detalii', formData.lucrare_detalii);
        if (formData.service_utilaj) {
            payload.append('service_utilaj', formData.service_utilaj.toString());
        }

        // ✅ Mapăm corect toate checkbox-urile ca string "true"/"false"
        [...Object.entries(formData.revizie), ...Object.entries(formData.revizie1), ...Object.entries(formData.revizie2)]
            .forEach(([key, value]) => payload.append(key, value ? 'true' : 'false'));

        // ✅ Atașăm fișierul PDF, dacă există
        if (formData.file && formData.service_utilaj) {
           // payload.append('file', formData.file);
           payload.append('file', {
            uri: Platform.OS === 'ios' ? formData.file.uri.replace('file://', '') : formData.file.uri,
            name: formData.file.name,
            type: formData.file.type,
          });
        }

        // ✅ Folosim API-ul corect observat în Network
        const requestSend = await apiService.request('rest_fc_faz_lucrareandfcformdata/', 'POST', payload, false, true);

        if (requestSend && !requestSend.error) {
            Alert.alert('Succes', 'Datele au fost trimise cu succes!');
            if(formData.file && formData.file.uri) {
                try {
                    await RNFS.unlink(formData.file.uri.replace("file://", ""));
                } catch (error) {
                    console.error("🚨 Eroare la ștergerea fișierului:", error);
                }
            }
            onDismiss();
        } else {
            Alert.alert('Eroare', 'A apărut o eroare la trimiterea datelor!');
        }
    };

    // ✅ Verificăm dacă butonul trebuie să fie activ sau nu
    const isButtonDisabled = !formData.index || !formData.data;

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
                <SafeAreaView style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        <Button onPress={onDismiss} textColor={theme.colors.onSurface} style={styles.closeButton}>X</Button>
                        <Divider />

                        <Text style={[styles.modalSubtitle, { color: theme.colors.onSurface }]}>Utilaj: {utilajId}</Text>

                        {/* Câmp Index */}
                        <TextInput
                            label="Index*"
                            mode="outlined"
                            defaultValue={formData.index} // ✅ Nu forțează re-render-ul
                            onChangeText={(text) => handleDebouncedChange('index', text)}
                            placeholderTextColor={theme.colors.onSurface}
                            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.onSurface }]}
                            theme={{ colors: { text: theme.colors.onSurface } }}
                        />

                        {/* 🔥 Date Picker - modificat pentru a fi clicabil */}
                        <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
                            <TextInput
                                label="Data*"
                                mode="outlined"
                                value={formData.data ? formData.data.toLocaleDateString() : ''}
                                style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.onSurface }]}
                                editable={false} // 🔹 Evităm input manual
                                pointerEvents="none" // 🔹 Previne interacțiunea accidentală
                                placeholderTextColor={theme.colors.onSurface}
                                theme={{ colors: { text: theme.colors.onSurface } }}
                            />
                        </TouchableOpacity>

                        {/* Date Picker Modal */}
                        <DatePickerModal
                            locale="ro"
                            mode="single"
                            visible={datePickerVisible}
                            onDismiss={() => setDatePickerVisible(false)}
                            date={formData.data || undefined}
                            onConfirm={(params) => {
                                setDatePickerVisible(false);
                                handleChange('data', params.date);
                            }}
                        />

                        <Divider />

                        {/* 🔥 Lista de revizii */}
                        <List.Section title="Date Vehicul">
                            <List.Accordion title="Revizie" titleStyle={{ color: theme.colors.onSurface }}>
                                {Object.keys(formData.revizie).map((key) => (
                                    <View style={styles.checkboxContainer} key={key}>
                                        <Checkbox
                                            status={formData.revizie[key as keyof typeof formData.revizie] ? 'checked' : 'unchecked'}
                                            onPress={() => handleCheckboxChange('revizie', key)}
                                            color={theme.colors.primary}
                                        />
                                        <Text style={{ color: theme.colors.onSurface }}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                                    </View>
                                ))}
                            </List.Accordion>

                            <List.Accordion title="Revizie 1 +" titleStyle={{ color: theme.colors.onSurface }}>
                                {Object.keys(formData.revizie1).map((key) => (
                                    <View style={styles.checkboxContainer} key={key}>
                                        <Checkbox
                                            status={formData.revizie1[key as keyof typeof formData.revizie1] ? 'checked' : 'unchecked'}
                                            onPress={() => handleCheckboxChange('revizie1', key)}
                                            color={theme.colors.primary}
                                        />
                                        <Text style={{ color: theme.colors.onSurface }}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                                    </View>
                                ))}
                            </List.Accordion>

                            <List.Accordion title="Revizie 2 +" titleStyle={{ color: theme.colors.onSurface }}>
                                {Object.keys(formData.revizie2).map((key) => (
                                    <View style={styles.checkboxContainer} key={key}>
                                        <Checkbox
                                            status={formData.revizie2[key as keyof typeof formData.revizie2] ? 'checked' : 'unchecked'}
                                            onPress={() => handleCheckboxChange('revizie2', key)}
                                            color={theme.colors.primary}
                                        />
                                        <Text style={{ color: theme.colors.onSurface }}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                                    </View>
                                ))}
                            </List.Accordion>
                        </List.Section>

                        <Divider />

                        <View style={styles.pickerContainer}>
                            <Text style={[styles.labelText, { color: theme.colors.onSurface }]}>Service</Text>

                            {services.length > 0 ? (
                                <Picker
                                    selectedValue={formData.service_utilaj || null} onValueChange={(itemValue) => handleChange('service_utilaj', itemValue)}
                                >
                                    <Picker.Item label="Selectează un service" value={null} />
                                    {services.map((service, index) => (
                                        <Picker.Item key={index} label={service.titlu} value={service.id} />
                                    ))}
                                </Picker>
                            ) : (
                                <Text style={{ color: theme.colors.onSurface }}>Nu exista servicii disponibile</Text>
                            )}
                        </View>

                        {/* TextArea pentru detalii lucrări */}
                        <TextInput
                            label="Detalii lucrări efectuate"
                            mode="outlined"
                            defaultValue={formData.lucrare_detalii}
                            onChangeText={(text) => handleDebouncedChange('lucrare_detalii', text)}
                            multiline numberOfLines={4}
                            style={[styles.textArea, { backgroundColor: theme.colors.surface, color: theme.colors.onSurface }]}
                            theme={{ colors: { text: theme.colors.onSurface } }}
                        />

                        {formData.service_utilaj && (
                            <>
                                <Divider />
                                <DocumentScannerComponent onPdfGenerated={handlePdfGenerated} />
                            </>
                        )}
                        <Divider />

                        {/* Buton de submit */}
                        <Button mode="contained" onPress={handleSubmit} style={[styles.buttonTrimite, { backgroundColor: theme.colors.primary }]} disabled={isButtonDisabled}>
                            Trimite
                        </Button>
                        <Divider />
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        //  backgroundColor: 'white',
        //alignItems: 'center' as 'center',
        width: '100%',
    },
    closeButton: {
        alignSelf: 'flex-end' as 'flex-end',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 18,
    },
    modalSubtitle: {
        fontSize: 15,
        paddingLeft: 10,
        paddingTop: 10,
    },
    container: {
        // flex: 1,
        // backgroundColor: '#f8f8f8',
        padding: 10,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 10,
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        margin: 10,
        marginBottom: 20,
        marginTop: 20,
    },
    labelText: {
        fontSize: 16,
    },
    input: {
        marginHorizontal: 10,
        marginVertical: 5,
    },
    textArea: {
        margin: 10,
        height: 100,
        textAlignVertical: 'top',
        // backgroundColor: '#fff',
        // color: '#000000',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
    },
    buttonTrimite: {
        marginTop: 10,
        marginBottom: 10,
        // backgroundColor: '#007bff',
        // color: '#fff',
    },
    pickerContainer: {
        margin: 10,
    },
});

export default AdaugaServiciuModal;
