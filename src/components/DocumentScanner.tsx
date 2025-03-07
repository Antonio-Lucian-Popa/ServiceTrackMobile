import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet, ScrollView, Image, PermissionsAndroid, Platform, Text } from 'react-native';
import { Button, Icon, IconButton, useTheme } from 'react-native-paper';
import DocumentScanner from 'react-native-document-scanner-plugin';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';


interface DocumentScannerScreenProps {
  onPdfGenerated: (pdfPath: string) => void; // ✅ Prop pentru trimiterea PDF-ului
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

    try {
        // ✅ Convertim imaginile în base64
        const base64Images = await convertImagesToBase64(scannedImages);

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

        base64Images.forEach((imageBase64: any, index: number) => {
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
            base64: true, // ✅ Generăm PDF direct ca base64
        };

        const pdf = await RNHTMLtoPDF.convert(options);

        if (pdf.base64) {
            console.log("📂 PDF generat în Base64");
            onPdfGenerated(pdf.base64); // ✅ Trimitem base64 la formular
        } else {
            Alert.alert('Eroare', 'Nu s-a putut genera PDF-ul.');
        }
    } catch (error) {
        console.error('Eroare la generarea PDF-ului:', error);
        Alert.alert('Eroare', 'Nu s-a putut genera PDF-ul.');
    }
};


// Funcție pentru conversia imaginilor scanate în base64
const convertImagesToBase64 = async (imageUris: string[]) => {
  try {
      const base64Images = await Promise.all(
          imageUris.map(async (uri) => {
              const base64 = await RNFS.readFile(uri, 'base64');
              return `data:image/jpeg;base64,${base64}`;
          })
      );
      return base64Images;
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
        <Button
          mode="contained"
          onPress={generatePDF}
          style={[styles.buttonGen, { backgroundColor: theme.colors.secondary }]}
          disabled={scannedImages.length === 0}
        >
          <View style={styles.buttonContent}>
            <Icon
              source="file-pdf-box"
              size={20}
              color={theme.colors.onSecondary}
            />
            <Text style={[{ color: theme.colors.onSecondary }]}>
              Generează PDF
            </Text>
          </View>
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
