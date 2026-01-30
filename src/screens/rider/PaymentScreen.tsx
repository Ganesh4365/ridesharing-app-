import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  TextInput,
  RadioButton,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import { PAYMENT_METHODS } from '../../constants';

const PaymentScreen = ({ route, navigation }: any) => {
  const { rideId, amount, driverId } = route.params;
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const theme = useTheme();
  const paperTheme = usePaperTheme();

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      Alert.alert(
        'Payment Successful',
        `₹${amount} has been successfully paid.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Payment Failed', 'Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getMethodInfo = () => {
    const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
    return method || PAYMENT_METHODS[0];
  };

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'card':
        return (
          <View style={styles.paymentForm}>
            <TextInput
              label="Card Number"
              value={cardNumber}
              onChangeText={setCardNumber}
              mode="outlined"
              keyboardType="numeric"
              maxLength={19}
              placeholder="1234 5678 9012 3456"
              style={styles.input}
            />
            <View style={styles.cardRow}>
              <TextInput
                label="Expiry"
                value={cardExpiry}
                onChangeText={setCardExpiry}
                mode="outlined"
                keyboardType="numeric"
                maxLength={5}
                placeholder="MM/YY"
                style={[styles.input, styles.cardInput]}
              />
              <TextInput
                label="CVV"
                value={cardCVV}
                onChangeText={setCardCVV}
                mode="outlined"
                keyboardType="numeric"
                maxLength={3}
                style={[styles.input, styles.cardInput]}
              />
            </View>
          </View>
        );
      
      case 'upi':
        return (
          <View style={styles.paymentForm}>
            <TextInput
              label="UPI ID"
              value={upiId}
              onChangeText={setUpiId}
              mode="outlined"
              placeholder="username@paytm"
              style={styles.input}
            />
          </View>
        );
      
      default:
        return (
          <View style={styles.paymentForm}>
            <Text style={[styles.infoText, { color: theme.theme.colors.textSecondary }]}>
              {getMethodInfo().icon} Pay using {getMethodInfo().name}
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Fare Summary */}
        <Card style={[styles.card, { backgroundColor: theme.theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.theme.colors.text }]}>
            Fare Summary
          </Text>
          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: theme.theme.colors.textSecondary }]}>
              Ride Fare
            </Text>
            <Text style={[styles.fareValue, { color: theme.theme.colors.text }]}>
              ₹{amount}
            </Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: theme.theme.colors.textSecondary }]}>
              Platform Fee
            </Text>
            <Text style={[styles.fareValue, { color: theme.theme.colors.text }]}>
              ₹5
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.theme.colors.border }]} />
          <View style={styles.fareRow}>
            <Text style={[styles.totalLabel, { color: theme.theme.colors.text }]}>
              Total Amount
            </Text>
            <Text style={[styles.totalValue, { color: theme.theme.colors.primary }]}>
              ₹{parseInt(amount) + 5}
            </Text>
          </View>
        </Card>

        {/* Payment Methods */}
        <Card style={[styles.card, { backgroundColor: theme.theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.theme.colors.text }]}>
            Payment Method
          </Text>
          
          <RadioButton.Group
            onValueChange={setSelectedMethod}
            value={selectedMethod}
          >
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  { 
                    backgroundColor: selectedMethod === method.id 
                      ? theme.theme.colors.primary + '20' 
                      : 'transparent',
                    borderColor: theme.theme.colors.border,
                  }
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.methodIcon}>{method.icon}</Text>
                  <Text style={[styles.methodName, { color: theme.theme.colors.text }]}>
                    {method.name}
                  </Text>
                </View>
                <RadioButton
                  value={method.id}
                  color={theme.theme.colors.primary}
                />
              </TouchableOpacity>
            ))}
          </RadioButton.Group>
        </Card>

        {/* Payment Form */}
        {renderPaymentForm()}

        {/* Process Payment Button */}
        <Button
          mode="contained"
          onPress={handlePayment}
          loading={isProcessing}
          disabled={isProcessing}
          style={[styles.payButton, { backgroundColor: theme.theme.colors.primary }]}
          contentStyle={styles.buttonContent}
        >
          Pay ₹{parseInt(amount) + 5}
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fareLabel: {
    fontSize: 16,
  },
  fareValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
  },
  paymentForm: {
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardInput: {
    flex: 0.48,
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  payButton: {
    marginTop: 20,
    marginBottom: 40,
  },
  buttonContent: {
    paddingVertical: 14,
  },
});

export default PaymentScreen;