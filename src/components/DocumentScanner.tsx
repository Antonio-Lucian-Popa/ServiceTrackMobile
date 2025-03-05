import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet, ScrollView, Image, PermissionsAndroid, Platform, Text } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import DocumentScanner from 'react-native-document-scanner-plugin';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';

interface DocumentScannerScreenProps {
  onPdfGenerated: (pdfPath: string) => void; // ✅ Prop pentru trimiterea PDF-ului
}

const DocumentScannerScreen: React.FC<DocumentScannerScreenProps> = ({ onPdfGenerated }) => {
  const [scannedImages, setScannedImages] = useState<string[]>([]);
  const [pdfPath, setPdfPath] = useState<string | null>(null);

  // 🔹 Cerere permisiuni la montare
  useEffect(() => {
    if (Platform.OS === 'android') {
      requestStoragePermission();
    }
  }, []);

  // 🔹 Cerere permisiuni Android
  const requestStoragePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Acces la fișiere',
          message: 'Aplicația are nevoie de permisiune pentru a deschide fișiere PDF.',
          buttonNeutral: 'Mai târziu',
          buttonNegative: 'Refuz',
          buttonPositive: 'Permite',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Eroare permisiuni:', err);
      return false;
    }
  };

  // 🔹 Funcție pentru scanarea documentelor
  const handleScanDocument = async () => {
    try {
      const { scannedImages: newScannedImages } = await DocumentScanner.scanDocument();
      if ((newScannedImages ?? []).length > 0) {
        setScannedImages([...scannedImages, ...(newScannedImages ?? [])]);
        Alert.alert('Succes', 'Scanare completă!');
      } else {
        Alert.alert('Eroare', 'Nicio imagine scanată.');
      }
    } catch (error) {
      console.error('Eroare scanare:', error);
      Alert.alert('Eroare', 'A apărut o problemă la scanare.');
    }
  };

  // 🔹 Eliminarea unei imagini scanate
  const handleRemoveImage = (index: number) => {
    setScannedImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  // 🔹 Generare PDF
  const generatePDF = async () => {
    if (scannedImages.length === 0) {
      Alert.alert('Eroare', 'Nu există imagini scanate!');
      return;
    }

    let htmlContent = `
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; }
            body { width: 100%; height: 100%; }
            .page { display: flex; align-items: center; justify-content: center; height: 100vh; }
            img { width: 100vw; height: 100vh; object-fit: cover; } 
          </style>
        </head>
        <body>
    `;

    scannedImages.forEach((imageUri, index) => {
      htmlContent += `
        <div class="page" ${index < scannedImages.length - 1 ? 'style="page-break-after: always;"' : ''}>
          <img src="${imageUri}" />
        </div>
      `;
    });

    htmlContent += `
        </body>
      </html>
    `;

    try {
      const options = {
        html: htmlContent,
        fileName: 'scanned_document',
        directory: 'Documents',
        base64: false,
      };

      const pdf = await RNHTMLtoPDF.convert(options);
      if (pdf.filePath) {
        setPdfPath(pdf.filePath);
        Alert.alert('Succes', `PDF generat: ${pdf.filePath}`);
        onPdfGenerated(pdf.filePath); // ✅ Trimiterea PDF-ului către componenta părinte
      } else {
        Alert.alert('Eroare', 'Nu s-a putut genera PDF-ul.');
      }
    } catch (error) {
      console.error('Eroare la generarea PDF-ului:', error);
      Alert.alert('Eroare', 'Nu s-a putut genera PDF-ul.');
    }
  };


  // 🔹 Verificarea existenței PDF-ului
  const checkPDFExists = async (path: string) => {
    const exists = await RNFS.exists(path);
    if (!exists) {
      Alert.alert('Eroare', 'Fișierul PDF nu există!');
      return false;
    }
    return true;
  };

  // 🔹 Funcție pentru deschiderea PDF-ului
  const openPDF = async () => {
    if (!pdfPath) {
      Alert.alert('Eroare', 'Nu există PDF generat.');
      return;
    }

    const exists = await checkPDFExists(pdfPath);
    if (!exists) return;

    try {
      const filePath = Platform.OS === 'android' ? `file://${pdfPath}` : pdfPath;
      await FileViewer.open(filePath, { showOpenWithDialog: true });
    } catch (error) {
      console.error('Eroare deschidere PDF:', error);
      Alert.alert('Eroare', 'Nu s-a putut deschide PDF-ul. Verifică dacă ai un vizualizator PDF instalat.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <Button mode="contained" onPress={handleScanDocument} style={styles.buttonScan}>
          Scanare Document
        </Button>
        <Button mode="contained" onPress={generatePDF} style={styles.buttonGen} disabled={scannedImages.length === 0}>
          <IconButton
            icon="file-pdf-box" // Pictogramă pentru PDF
            size={30}
          />
          <Text style={{ fontSize: 12, color: 'gray' }}>Generează PDF</Text>
        </Button>

      </View>

      {/* 🔹 Lista imaginilor scanate */}
      <ScrollView contentContainerStyle={styles.imageContainer}>
        {scannedImages.map((imageUri, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri: imageUri }} style={styles.scannedImage} />
            <IconButton
              icon="delete"
              size={24}
              onPress={() => handleRemoveImage(index)}
              style={styles.removeButton}
              iconColor="red"
            />
          </View>
        ))}
      </ScrollView>

      {/* 🔹 Buton pentru deschiderea PDF-ului */}
      {pdfPath && (
        <Button mode="contained" onPress={openPDF} style={styles.openPdfButton}>
          Deschide PDF
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    // padding: 10,
  },
  buttonRow: {
    flexDirection: 'column',
    //justifyContent: 'space-between',
    width: '90%',
    marginTop: 10,
  },
  buttonScan: {
    // marginTop: 10,
    margin: 10,
    backgroundColor: '#ccc',
    color: '#fff',
    flex: 1,
    marginHorizontal: 5,
  },
  buttonGen: {
    // marginTop: 10,
    margin: 10,
    // green background
    color: '#fff',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    // paddingBottom: 20,
  },
  imageWrapper: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 10,
  },
  scannedImage: {
    width: 300,
    height: 400,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    marginBottom: 10,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 20,
  },
  openPdfButton: {
    marginTop: 20,
    width: '90%',
  },
});

export default DocumentScannerScreen;
