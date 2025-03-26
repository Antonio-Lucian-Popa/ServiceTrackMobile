import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, TextInput, StyleSheet } from 'react-native';
import { DataTable, IconButton, useTheme } from 'react-native-paper';

export interface Service {
  id: number;
  inventar: string;
  tip: string;
}

interface Props {
  onRowPress: (service: Service) => void;
}

const ServiceTable: React.FC<Props> = ({ onRowPress }) => {
  const { colors } = useTheme();
  const [data, setData] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('0');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

   // 🔹 Funcție pentru a obține datele
   const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');

      const queryParams = new URLSearchParams({
        draw: '1',
        start: (page * itemsPerPage).toString(),
        length: itemsPerPage.toString(),
        'search[value]': searchQuery,
        'order[0][column]': sortColumn,
        'order[0][dir]': sortDirection,
      }).toString();

      const url = `https://test.uti.umbgrup.ro/utilajetot_list/?${queryParams}`;
     //const url = `https://uti.umbgrup.ro/utilajetot_list/?${queryParams}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.data && Array.isArray(result.data)) {
        setData(result.data);
        setTotalItems(result.recordsTotal || result.data.length);
      } else {
        setData([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, searchQuery, sortColumn, sortDirection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔄 Funcție pentru refresh manual
  const handleRefresh = () => {
    setPage(0); // Resetăm la prima pagină
    fetchData(); // Reîncărcăm datele
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TextInput
          placeholder="Caută..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setPage(0); // Resetăm pagina când căutăm
          }}
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.primary, color: colors.onSurface },
          ]}
          placeholderTextColor={colors.onSurface}
        />
        {/* 🔄 Buton de Refresh */}
        <IconButton icon="refresh" size={24} onPress={handleRefresh} />
      </View>
      {loading ? (
        <ActivityIndicator animating size="large" />
      ) : (
        <DataTable style={styles.table}>
          <DataTable.Header style={[styles.header, { backgroundColor: colors.primary }]}>
            <DataTable.Title
              sortDirection={sortColumn === '0' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
              onPress={() => {
                setSortColumn('0');
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              }}
              textStyle={[styles.headerText, { color: colors.onPrimary }]}
            >
              Inventar
            </DataTable.Title>
            <DataTable.Title
              sortDirection={sortColumn === '1' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
              onPress={() => {
                setSortColumn('1');
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              }}
              textStyle={[styles.headerText, { color: colors.onPrimary }]}
            >
              Tip
            </DataTable.Title>
          </DataTable.Header>

          {data.map((item) => (
            <DataTable.Row key={item.id} onPress={() => onRowPress(item)}>
              <DataTable.Cell textStyle={{ color: colors.onSurface }}>{item.inventar}</DataTable.Cell>
              <DataTable.Cell textStyle={{ color: colors.onSurface }}>{item.tip}</DataTable.Cell>
            </DataTable.Row>
          ))}

          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(totalItems / itemsPerPage)}
            onPageChange={(newPage) => setPage(newPage)}
            label={`${page * itemsPerPage + 1}-${Math.min((page + 1) * itemsPerPage, totalItems)} din ${totalItems}`}
          />
        </DataTable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    width: '80%',
  },
  table: {
    borderRadius: 10,
  },
  header: {
    borderRadius: 5,
  },
  headerText: {
    fontWeight: 'bold',
  },
});

export default ServiceTable;