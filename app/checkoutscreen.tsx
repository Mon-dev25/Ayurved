import { Alert, Button } from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CheckoutScreen() {

  const fetchOrderParams = async (amount: number) => {
    const response = await fetch("http://localhost:8081/api/razorpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }), // amount in paise
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  };

const openPaymentSheet = async () => {
    try {
      const consultationFee = 5000;
      const { orderId, amount, currency, keyId } = await fetchOrderParams(consultationFee);
      
      console.log("Order params:", { orderId, amount, currency, keyId }); // check this

      const options = {
        description: "Doctor Consultation Fee",
        currency: currency,
        key: keyId,
        amount: amount,
        order_id: orderId,
        name: "Ayur",
        prefill: {
          email: "patient@example.com",
          contact: "9999999999",
          name: "Patient Name",
        },
        theme: { color: "#528FF0" },
      };

      const data = await RazorpayCheckout.open(options);
      Alert.alert("Success", `Payment successful!`);

    } catch (error: any) {
      console.log("Full error:", JSON.stringify(error)); // check this
      Alert.alert("Error", error.description ?? error.message ?? "Payment failed");
    }
  };

  return (
    <SafeAreaView>
      <Button title="Pay Now" onPress={openPaymentSheet} />
    </SafeAreaView>
  );
}
