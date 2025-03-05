import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, useColorScheme } from 'react-native';
import { Divider, PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import AdaugaServiciuModal from './AdaugaServiciuModal';
import ServiceTable, { Service } from '../components/ServiceTable';



const HomeScreen = () => {
  const [visible, setVisible] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState<Service | null>(null);

  const showModal = (rowData: Service) => {
    setSelectedRowData(rowData);
    setVisible(true);
  };
  const hideModal = () => setVisible(false);

  const scheme = useColorScheme(); // 🔥 Detectează tema sistemului
  const theme = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme; // 🔥 Alege tema automat
  

  return (
    <PaperProvider theme={theme}>
      <ScrollView style={[styles.containerView, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.onBackground }]}>Bine ai venit, Antonio!👋</Text>
        <Divider style={{ backgroundColor: theme.colors.primary }} />
        <Text style={[styles.textFlota, { color: theme.colors.onBackground }]}>Flota Utilaje</Text>
        <ServiceTable onRowPress={showModal} />
        <AdaugaServiciuModal visible={visible} onDismiss={hideModal} rowData={selectedRowData} />
      </ScrollView>
    </PaperProvider>
  );
};


const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1, // Asigură că se poate face scroll
  },
  containerView: {
    flex: 1,
   // justifyContent: 'center',
   // alignItems: 'center',
  },
  text: {
    width: '100%',
    textAlign: 'left',
    fontSize: 20,
    fontWeight: 'bold',
   // color: '#333',
    margin: 10,
    marginBottom: 20,
    marginTop: 30,
  },
  textFlota: {
    width: '100%',
    textAlign: 'left',
    fontSize: 15,
    fontWeight: 'bold',
    //color: '#333',
    margin: 10,
    marginBottom: 10,
    marginTop: 20,
  }
});


export default HomeScreen;
