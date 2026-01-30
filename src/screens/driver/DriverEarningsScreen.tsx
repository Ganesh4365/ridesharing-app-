import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  FAB,
  useTheme as usePaperTheme,
  Chip,
} from 'react-native-paper';
// import { LineChart } from 'react-native-chart-kit'; // Temporarily disabled
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');
const chartWidth = width - 40;

const DriverEarningsScreen = ({ navigation }: any) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [earnings, setEarnings] = useState({
    total: 0,
    rides: 0,
    average: 0,
    commission: 0,
  });
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const theme = useTheme();
  const paperTheme = usePaperTheme();
  const { user } = useAuth();

  useEffect(() => {
    // Load earnings data
    loadEarningsData();
  }, [selectedPeriod]);

  const loadEarningsData = () => {
    // Mock data - in real app, fetch from API
    const mockData = {
      week: {
        earnings: {
          total: 2850,
          rides: 42,
          average: 67.86,
          commission: 285,
        },
        chartData: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{ data: [320, 480, 380, 520, 450, 580, 520] }],
        },
        transactions: [
          { id: '1', date: '2024-01-28', amount: 450, type: 'ride', status: 'completed' },
          { id: '2', date: '2024-01-28', amount: 380, type: 'ride', status: 'completed' },
          { id: '3', date: '2024-01-27', amount: 520, type: 'ride', status: 'completed' },
          { id: '4', date: '2024-01-27', amount: 290, type: 'bonus', status: 'completed' },
          { id: '5', date: '2024-01-26', amount: 480, type: 'ride', status: 'completed' },
        ],
      },
      month: {
        earnings: {
          total: 12400,
          rides: 180,
          average: 68.89,
          commission: 1240,
        },
        chartData: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{ data: [2850, 3200, 3100, 3250] }],
        },
        transactions: [
          { id: '1', date: '2024-01-28', amount: 450, type: 'ride', status: 'completed' },
          { id: '2', date: '2024-01-27', amount: 520, type: 'ride', status: 'completed' },
          { id: '3', date: '2024-01-26', amount: 480, type: 'ride', status: 'completed' },
        ],
      },
      year: {
        earnings: {
          total: 148800,
          rides: 2160,
          average: 68.89,
          commission: 14880,
        },
        chartData: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{ data: [12400, 13200, 11800, 12900, 13500, 14200, 13800, 12800, 13400, 13900, 13200, 12100] }],
        },
        transactions: [
          { id: '1', date: '2024-01-28', amount: 450, type: 'ride', status: 'completed' },
          { id: '2', date: '2024-01-27', amount: 520, type: 'ride', status: 'completed' },
        ],
      },
    };

    const data = mockData[selectedPeriod];
    setEarnings(data.earnings);
    setChartData(data.chartData);
    setTransactions(data.transactions);
  };

  const chartConfig = {
    backgroundColor: theme.theme.colors.surface,
    backgroundGradientFrom: theme.theme.colors.surface,
    backgroundGradientTo: theme.theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.theme.colors.primary,
    labelColor: (opacity = 1) => theme.theme.colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.theme.colors.primary,
    },
  };

  const getPeriodData = () => {
    switch (selectedPeriod) {
      case 'today':
        return { label: 'Today', date: 'January 28, 2024' };
      case 'week':
        return { label: 'This Week', date: 'Jan 22 - Jan 28, 2024' };
      case 'month':
        return { label: 'This Month', date: 'January 2024' };
      case 'year':
        return { label: 'This Year', date: '2024' };
      default:
        return { label: 'This Week', date: 'Jan 22 - Jan 28, 2024' };
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'ride':
        return '🚗';
      case 'bonus':
        return '🎁';
      case 'refund':
        return '↩️';
      default:
        return '💰';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'ride':
        return '#4CAF50';
      case 'bonus':
        return '#FF9800';
      case 'refund':
        return '#F44336';
      default:
        return theme.theme.colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.theme.colors.text }]}>
            Earnings
          </Text>
          <Text style={[styles.subtitle, { color: theme.theme.colors.textSecondary }]}>
            {getPeriodData().label}
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodContainer}>
          {['today', 'week', 'month', 'year'].map((period) => (
            <Chip
              key={period}
              selected={selectedPeriod === period}
              onPress={() => setSelectedPeriod(period)}
              style={[
                styles.periodChip,
                { 
                  backgroundColor: selectedPeriod === period 
                    ? theme.theme.colors.primary 
                    : theme.theme.colors.surface,
                }
              ]}
              textStyle={{
                color: selectedPeriod === period 
                  ? 'white' 
                  : theme.theme.colors.text,
              }}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Chip>
          ))}
        </View>

        {/* Earnings Summary */}
        <View style={styles.summaryContainer}>
          <Card style={[styles.summaryCard, { backgroundColor: theme.theme.colors.surface }]}>
            <Text style={[styles.summaryTitle, { color: theme.theme.colors.text }]}>
              Total Earnings
            </Text>
            <Text style={[styles.summaryAmount, { color: theme.theme.colors.primary }]}>
              ₹{earnings.total.toLocaleString()}
            </Text>
            <Text style={[styles.summaryDate, { color: theme.theme.colors.textSecondary }]}>
              {getPeriodData().date}
            </Text>
          </Card>
          
          <View style={styles.statsContainer}>
            <Card style={[styles.statCard, { backgroundColor: theme.theme.colors.surface }]}>
              <Text style={[styles.statValue, { color: theme.theme.colors.text }]}>
                {earnings.rides}
              </Text>
              <Text style={[styles.statLabel, { color: theme.theme.colors.textSecondary }]}>
                Rides
              </Text>
            </Card>
            
            <Card style={[styles.statCard, { backgroundColor: theme.theme.colors.surface }]}>
              <Text style={[styles.statValue, { color: theme.theme.colors.text }]}>
                ₹{earnings.average}
              </Text>
              <Text style={[styles.statLabel, { color: theme.theme.colors.textSecondary }]}>
                Avg/ride
              </Text>
            </Card>
            
            <Card style={[styles.statCard, { backgroundColor: theme.theme.colors.surface }]}>
              <Text style={[styles.statValue, { color: theme.theme.colors.text }]}>
                ₹{earnings.commission}
              </Text>
              <Text style={[styles.statLabel, { color: theme.theme.colors.textSecondary }]}>
                Commission
              </Text>
            </Card>
          </View>
        </View>

        {/* Earnings Chart */}
        <View style={styles.chartContainer}>
          <Card style={[styles.chartCard, { backgroundColor: theme.theme.colors.surface }]}>
            <Text style={[styles.chartTitle, { color: theme.theme.colors.text }]}>
              Earnings Trend
            </Text>
            {chartData.labels.length > 0 ? (
              // <LineChart
              //   data={chartData}
              //   width={chartWidth}
              //   height={200}
              //   chartConfig={chartConfig}
              //   bezier
              //   style={styles.chart}
              // />
              <View style={styles.noDataContainer}>
                <Text style={[styles.noDataText, { color: theme.theme.colors.textSecondary }]}>
                  Chart functionality available with react-native-chart-kit
                </Text>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={[styles.noDataText, { color: theme.theme.colors.textSecondary }]}>
                  No data available for this period
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.theme.colors.text }]}>
            Recent Transactions
          </Text>
          
          {transactions.map((transaction) => (
            <Card
              key={transaction.id}
              style={[styles.transactionCard, { backgroundColor: theme.theme.colors.surface }]}
            >
              <View style={styles.transactionRow}>
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionIcon}>
                    {getTransactionIcon(transaction.type)}
                  </Text>
                  <View style={styles.transactionDetails}>
                    <Text style={[
                      styles.transactionAmount,
                      { color: getTransactionColor(transaction.type) }
                    ]}>
                      {transaction.type === 'refund' ? '-' : '+'}₹{transaction.amount}
                    </Text>
                    <Text style={[styles.transactionType, { color: theme.theme.colors.textSecondary }]}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[styles.transactionDate, { color: theme.theme.colors.textSecondary }]}>
                    {transaction.date}
                  </Text>
                  <Text style={[
                    styles.transactionStatus,
                    { color: transaction.status === 'completed' ? '#4CAF50' : '#FF9800' }
                  ]}>
                    {transaction.status}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Withdraw Button */}
        <Button
          mode="contained"
          onPress={() => Alert.alert('Withdraw', 'Withdrawal request submitted successfully.')}
          style={[styles.withdrawButton, { backgroundColor: theme.theme.colors.primary }]}
          contentStyle={styles.buttonContent}
        >
          Withdraw Earnings
        </Button>
      </ScrollView>

      {/* FAB for Payout Settings */}
      <FAB
        icon="cog"
        label="Payout Settings"
        style={styles.fab}
        onPress={() => Alert.alert('Payout Settings', 'Payout settings coming soon!')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  periodChip: {
    marginHorizontal: 2,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartCard: {
    padding: 20,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
  },
  transactionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  transactionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 14,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  withdrawButton: {
    marginBottom: 80,
  },
  buttonContent: {
    paddingVertical: 14,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 20,
    backgroundColor: '#FF9800',
  },
});

export default DriverEarningsScreen;