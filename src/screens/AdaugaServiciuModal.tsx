/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Modal, Portal, useTheme } from 'react-native-paper';
import { ServiceUtilaj, useServiceUtilaj } from '../services/ServiceUtilaj';

import { StyleSheet, Alert, View, TouchableOpacity, ScrollView, SafeAreaView, useColorScheme } from 'react-native';
import DocumentScannerComponent from '../components/DocumentScanner';
import { Text } from 'react-native';
import { Button, Checkbox, Divider, TextInput, List } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { Picker } from '@react-native-picker/picker';
import { Service } from '../components/ServiceTable';


interface AdaugaServiciuModalProps {
    visible: boolean;
    onDismiss: () => void;
    rowData: Service | null;
}

function useIsDarkMode() {
    return useColorScheme() === 'dark';
}

const AdaugaServiciuModal: React.FC<AdaugaServiciuModalProps> = ({ visible, onDismiss, rowData }) => {

    console.log("Row data: ", rowData);

    const theme = useTheme();

    const utilajId = rowData?.id;

    const [formData, setFormData] = useState({
        inventar: '',
        data: new Date(),
        index: '',
        lucrare_detalii: '',
        service_utilaj: '',
        file: null as string | null,
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
    });

    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [services, setServices] = useState<ServiceUtilaj[]>([]);
    // const [selectedService] = useState<string>(formData.service);

    const { findAllServicesOnUtilajId } = useServiceUtilaj();

    useEffect(() => {
        if (rowData) {
            const fetchServices = async () => {
                const servicesList = await findAllServicesOnUtilajId(rowData?.id);
                if (servicesList && servicesList.length > 0) {
                    setServices(servicesList);
                }
            };

            fetchServices();
        }
    }, []);

    // useEffect(() => {
    //     handleChange('service', selectedService);
    // }, [selectedService]);

    // ✅ Funcție generală pentru actualizarea valorilor în formular
    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

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
    const handleSubmit = () => {
        if (!formData.index) {
            Alert.alert('Eroare', 'Introduceți un index valid!');
            return;
        }

        if (!formData.service_utilaj && !formData.lucrare_detalii) {
            Alert.alert('Eroare', 'Trebuie sa scrieti macar detalile lucrarilor efectuate sau sa selectati un service!');
            return;
        }

       const payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'file' && value) {
                payload.append('file', {
                    uri: value,
                    name: 'document.pdf',
                    type: 'application/pdf',
                } as any);
            } else if (typeof value === 'object' && value !== null) {
                Object.entries(value).forEach(([subKey, subValue]) => {
                    payload.append(subKey, subValue.toString());
                });
            } else {
                if (value !== null) {
                    payload.append(key, value.toString());
                }
            }
        });
        Alert.alert('Succes', 'Datele au fost trimise!');
    };

    // ✅ Verificăm dacă butonul trebuie să fie activ sau nu
    const isButtonDisabled = !formData.index || !formData.data;

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
                {/* <View>
                    <Text style={styles.modalText}>Index: {rowData?.index}</Text>
                    <Text style={styles.modalText}>Service: {rowData?.service}</Text>
                </View> */}

                <SafeAreaView style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        <Button onPress={onDismiss} style={styles.closeButton}>X</Button>
                        <Divider />

                        <Text style={[styles.modalSubtitle, { color: theme.colors.onBackground }]}>Utilaj: {utilajId}</Text>

                        {/* Câmp Index */}
                        <TextInput
                            label="Index*"
                            mode="outlined"
                            value={formData.index}
                            onChangeText={(text) => handleChange('index', text)}
                            style={[styles.input, { backgroundColor: theme.colors.surface }]}
                        />

                        {/* 🔥 Date Picker - modificat pentru a fi clicabil */}
                        <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
                            <TextInput
                                label="Data*"
                                mode="outlined"
                                value={formData.data ? formData.data.toLocaleDateString() : ''}
                                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                                editable={false} // 🔹 Evităm input manual
                                pointerEvents="none" // 🔹 Previne interacțiunea accidentală
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
                            <List.Accordion title="Revizie">
                                {Object.keys(formData.revizie).map((key) => (
                                    <View style={styles.checkboxContainer} key={key}>
                                        <Checkbox
                                            status={formData.revizie[key as keyof typeof formData.revizie] ? 'checked' : 'unchecked'}
                                            onPress={() => handleCheckboxChange('revizie', key)}
                                        />
                                        <Text style={{ color: theme.colors.onBackground }}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                                    </View>
                                ))}
                            </List.Accordion>

                            <List.Accordion title="Revizie 1 +">
                                {Object.keys(formData.revizie1).map((key) => (
                                    <View style={styles.checkboxContainer} key={key}>
                                        <Checkbox
                                            status={formData.revizie1[key as keyof typeof formData.revizie1] ? 'checked' : 'unchecked'}
                                            onPress={() => handleCheckboxChange('revizie1', key)}
                                        />
                                        <Text style={{ color: theme.colors.onBackground }}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                                    </View>
                                ))}
                            </List.Accordion>

                            <List.Accordion title="Revizie 2 +">
                                {Object.keys(formData.revizie2).map((key) => (
                                    <View style={styles.checkboxContainer} key={key}>
                                        <Checkbox
                                            status={formData.revizie2[key as keyof typeof formData.revizie2] ? 'checked' : 'unchecked'}
                                            onPress={() => handleCheckboxChange('revizie2', key)}
                                        />
                                        <Text style={{ color: theme.colors.onBackground }}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                                    </View>
                                ))}
                            </List.Accordion>
                        </List.Section>

                        <Divider />

                        <View style={styles.pickerContainer}>
                            <Text style={styles.labelText}>Service</Text>

                            {services.length > 0 ? (
                                <Picker
                                    selectedValue={formData.service_utilaj} onValueChange={(itemValue) => handleChange('service_utilaj', itemValue)}
                                >
                                    {services.map((service, index) => (
                                        <Picker.Item key={index} label={service.titlu} value={service} />
                                    ))}
                                </Picker>
                            ) : (
                                <Text>Nu exista servicii disponibile</Text>
                            )}
                        </View>

                        {/* TextArea pentru detalii lucrări */}
                        <TextInput
                            label="Detalii lucrări efectuate"
                            mode="outlined"
                            value={formData.lucrare_detalii} onChangeText={(text) => handleChange('lucrare_detalii', text)} multiline numberOfLines={4} style={[styles.textArea, { backgroundColor: theme.colors.surface }]}
                        />

                        <Divider />
                        <DocumentScannerComponent onPdfGenerated={handlePdfGenerated} />
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
        backgroundColor: 'white',
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
        backgroundColor: '#f8f8f8',
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
        backgroundColor: '#fff',
        color: '#000000',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
    },
    buttonTrimite: {
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: '#007bff',
        color: '#fff',
    },
    pickerContainer: {
        margin: 10,
    },
});

export default AdaugaServiciuModal;
