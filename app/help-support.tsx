import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TINT = '#6050D0'

const CONTACT_ITEMS = [
  {
    key: 'email',
    icon: 'email' as const,
    label: 'Email Us',
    value: 'support@ayurwellness.com',
    sub: 'We reply within 24 hours',
    action: () => Linking.openURL('mailto:support@ayurwellness.com'),
    color: '#EEF2FF',
  },
  {
    key: 'phone',
    icon: 'phone' as const,
    label: 'Call Us',
    value: '+91 00000 00000',
    sub: 'Mon – Sat, 9 AM to 6 PM',
    action: () => Linking.openURL('tel:+910000000000'),
    color: '#F0FDF4',
  },
  {
    key: 'whatsapp',
    icon: 'chat' as const,
    label: 'WhatsApp',
    value: '+91 00000 00000',
    sub: 'Quick support on WhatsApp',
    action: () => Linking.openURL('https://wa.me/910000000000'),
    color: '#FFF7ED',
  },
]

const INFO_ITEMS = [
  { icon: 'schedule' as const, text: 'Available Monday to Saturday, 9 AM – 6 PM IST' },
  { icon: 'location-on' as const, text: 'Headquartered in Hyderabad, Telangana, India' },
  { icon: 'verified' as const, text: 'All doctors are certified Ayurvedic practitioners' },
]

export default function ContactUs() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View style={styles.root}>
      {/* Colored header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Contact Us</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSub}>We're here to help you on your wellness journey</Text>
      </View>

      {/* White card */}
      <View style={styles.card}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Contact options */}
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          {CONTACT_ITEMS.map((item) => (
            <Pressable key={item.key} style={styles.contactRow} onPress={item.action}>
              <View style={[styles.contactIcon, { backgroundColor: item.color }]}>
                <MaterialIcons name={item.icon} size={24} color={TINT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>{item.label}</Text>
                <Text style={styles.contactValue}>{item.value}</Text>
                <Text style={styles.contactSub}>{item.sub}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#C4C4C4" />
            </Pressable>
          ))}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Info section */}
          <Text style={styles.sectionTitle}>About Ayur</Text>
          <View style={styles.infoCard}>
            {INFO_ITEMS.map((item, i) => (
              <View key={i} style={[styles.infoRow, i < INFO_ITEMS.length - 1 && styles.infoRowBorder]}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name={item.icon} size={20} color={TINT} />
                </View>
                <Text style={styles.infoText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Footer note */}
          <View style={styles.footerNote}>
            <MaterialIcons name="favorite" size={16} color={TINT} />
            <Text style={styles.footerText}>
              Ayur connects patients with certified Ayurvedic doctors for holistic wellness — anytime, anywhere.
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: TINT,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 2,
  },
  contactSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    color: TINT,
    lineHeight: 20,
    fontWeight: '500',
  },
})