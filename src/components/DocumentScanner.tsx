import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet, ScrollView, Image, PermissionsAndroid, Platform } from 'react-native';
import { Button, IconButton, useTheme } from 'react-native-paper';
import DocumentScanner from 'react-native-document-scanner-plugin';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';


interface DocumentScannerScreenProps {
  onPdfGenerated: (pdfPath: any) => void; // ✅ Prop pentru trimiterea PDF-ului
}

const DocumentScannerScreen: React.FC<DocumentScannerScreenProps> = ({ onPdfGenerated }) => {
  const [scannedImages, setScannedImages] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pdfPath, setPdfPath] = useState<string | null>(null);

  const theme = useTheme(); // ✅ Folosește tema PaperProvider

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
        const updatedImages = [...scannedImages, ...newScannedImages ?? []];
        setScannedImages(updatedImages);

        // ✅ Generăm PDF imediat după scanare
        await generatePDF(updatedImages);
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
  const handleRemoveImage = async (index: number) => {
    const updatedImages = scannedImages.filter((_, i) => i !== index);
    setScannedImages(updatedImages);

    if (updatedImages.length > 0) {
        await generatePDF(updatedImages); // ✅ Generăm PDF din imaginile rămase
    } else {
        onPdfGenerated(null); // ❌ Dacă nu mai sunt imagini, trimitem `null` către părinte
        setPdfPath(null);
    }
  };

   // 🔹 Generare PDF automat după scanare
   const generatePDF = async (imageUris: string[]) => {
    if (imageUris.length === 0) return;

    try {
      const base64Images = await convertImagesToBase64(imageUris);

      let htmlContent = `
        <html>
          <head>
            <style>
              * { margin: 0; padding: 0; }
              body { width: 100%; height: 100%; }
              .page { display: flex; align-items: center; justify-content: center; height: 100vh; }
              img { width: 100vw; height: 100vh; object-fit: contain; } 
            </style>
          </head>
          <body>
      `;

      base64Images.forEach((imageBase64, index) => {
        htmlContent += `
          <div class="page" ${index < base64Images.length - 1 ? 'style="page-break-after: always;"' : ''}>
            <img src="${imageBase64}" />
          </div>
        `;
      });

      htmlContent += `</body></html>`;

      const options = {
        html: htmlContent,
        fileName: 'scanned_document',
        directory: 'Documents', // ✅ Salvăm PDF-ul în stocare
        base64: false, // ❌ Nu generăm Base64
    };

      const pdf = await RNHTMLtoPDF.convert(options);

      if (pdf.filePath) {
        // ✅ Trimitem PDF-ul ca obiect către componenta părinte
        const pdfFile = {
          uri: `file://${pdf.filePath}`,
          name: 'document.pdf',
          type: 'application/pdf',
      };

      onPdfGenerated(pdfFile);
        console.log('Succes', 'PDF generat cu succes!');
      } else {
        Alert.alert('Eroare', 'Nu s-a putut genera PDF-ul.');
      }
    } catch (error) {
      console.error('Eroare la generarea PDF-ului:', error);
      Alert.alert('Eroare', 'Nu s-a putut genera PDF-ul.');
    }
  };

  // ✅ Conversia imaginilor în base64
  const convertImagesToBase64 = async (imageUris: string[]) => {
    try {
      return await Promise.all(
        imageUris.map(async (uri) => {
          return `data:image/jpeg;base64,${await RNFS.readFile(uri, 'base64')}`;
        })
      );
    } catch (error) {
      console.error('Eroare la conversia imaginilor:', error);
      return [];
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.buttonRow}>
        <Button mode="contained" onPress={handleScanDocument} style={[styles.buttonScan, { backgroundColor: theme.colors.primary }]}>
          Scanare Document
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#f8f8f8',
    // padding: 10,
  },
  buttonContent: {
    flexDirection: 'row', // ✅ Aliniere orizontală a conținutului
    alignItems: 'center',
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
    // backgroundColor: '#ccc',
    //   color: '#fff',
    flex: 1,
    marginHorizontal: 5,
  },
  buttonGen: {
    // marginTop: 10,
    margin: 10,
    // green background
    // color: '#fff',
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