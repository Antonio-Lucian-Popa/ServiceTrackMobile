import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, TextInput, StyleSheet } from 'react-native';
import { DataTable, useTheme } from 'react-native-paper';

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

  useEffect(() => {
    const fetchData = async () => {
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

        const test = `https://test.uti.umbgrup.ro/utilajetot_list/?${queryParams}`;
        //const prod = `https://uti.umbgrup.ro/utilajetot_list/?${queryParams}`;

        const response = await fetch(test, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        console.log('Result: ', result);

        if (result.data && Array.isArray(result.data)) {
          setData(result.data);
          setTotalItems(result.recordsTotal || result.data.length);
        } else {
          console.error('Unexpected response format:', result);
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
    };

    fetchData();
  }, [page, itemsPerPage, searchQuery, sortColumn, sortDirection]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        placeholder="Caută..."
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          setPage(0);
        }}
        style={[
          styles.input,
          { backgroundColor: colors.surface, borderColor: colors.primary, color: colors.onSurface },
        ]}
        placeholderTextColor={colors.onSurface}
      />
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
  input: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
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
