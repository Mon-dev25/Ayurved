import { useDoctorContext } from '@/hooks/use-doctor-context';
import { supabase } from '@/lib/supabase.web';
import { useEffect, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function Consult() {
  const { selectedDoctor } = useDoctorContext();

  const [email, setEmail] = useState('');
  const [phoneno, setPhoneno] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('Therapist');

  const handleEmail = () => Linking.openURL(`mailto:${email}`);
  const handlePhone = () => Linking.openURL(`tel:${phoneno}`);

  useEffect(() => {
    if (!selectedDoctor) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('email,phone,full_name')
        .eq('id', selectedDoctor.id)
        .single();

      if (data) {
        setEmail(data.email);
        setPhoneno(data.phone);
        setName(data.full_name);
      }
    };

    fetch();
  }, [selectedDoctor?.id]);

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 30 }}>👩‍⚕️</Text>
        </View>

        <Text style={styles.name}>{name}</Text>
        <Text style={styles.specialty}>{title}</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handlePhone}>
            <Text style={styles.icon}>📞</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={handleEmail}>
            <Text style={styles.icon}>💬</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT CARD */}
      <View style={styles.card}>
        {/* About */}
        <Text style={styles.sectionTitle}>About doctor</Text>
        <Text style={styles.sectionText}>
          {name} is an experienced specialist who is constantly working on improving skills.
        </Text>

        {/* Reviews */}
        <View style={styles.reviewHeader}>
          <Text style={styles.sectionTitle}>Reviews ⭐ 4.9 (124)</Text>
          <Text style={styles.link}>See all</Text>
        </View>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewName}>User Review</Text>
          <Text style={styles.reviewText}>
            Many thanks to {name}! Professional and competent doctor.
          </Text>
        </View>

        {/* Location */}
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <View>
            <Text style={styles.locationTitle}>Medical Center</Text>
            <Text style={styles.locationSub}>Your clinic address here</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },

  header: {
    backgroundColor: "#6C63FF",
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },

  specialty: {
    fontSize: 14,
    color: "#ddd",
    marginBottom: 15,
  },

  actions: {
    flexDirection: "row",
    gap: 20,
  },

  iconBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 12,
    borderRadius: 50,
  },

  icon: {
    fontSize: 18,
    color: "#fff",
  },

  card: {
    backgroundColor: "#fff",
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },

  sectionText: {
    color: "#555",
    marginBottom: 20,
  },

  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  link: {
    color: "#6C63FF",
    fontWeight: "600",
  },

  reviewCard: {
    backgroundColor: "#f7f7f7",
    padding: 15,
    borderRadius: 15,
    marginVertical: 10,
  },

  reviewName: {
    fontWeight: "600",
    marginBottom: 5,
  },

  reviewText: {
    color: "#666",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },

  locationIcon: {
    fontSize: 18,
  },

  locationTitle: {
    fontWeight: "600",
  },

  locationSub: {
    color: "#666",
    fontSize: 12,
  },
});