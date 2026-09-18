import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Exchange, getHistory, sendMessage } from './src/api';

export default function App() {
  const [history, setHistory] = useState<Exchange[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function refresh() {
    setLoading(true);
    setError('');
    try { setHistory(await getHistory()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load history.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, []);

  async function send() {
    if (!message.trim() || sending || loading) return;
    setSending(true);
    setError('');
    try {
      const exchange = await sendMessage(message.trim());
      setHistory(current => [exchange, ...current]);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message.');
    } finally { setSending(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>YOUR AI COMPANION</Text>
        <Text style={styles.title}>Aitrainer</Text>
        <Text style={styles.subtitle}>A little guidance. A step forward.</Text>
        <View style={styles.toolbar}>
          <Text style={styles.section}>Your conversations</Text>
          <Pressable accessibilityRole="button" disabled={loading || sending} onPress={() => void refresh()}>
            <Text style={styles.link}>Refresh</Text>
          </Pressable>
        </View>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {loading ? <ActivityIndicator style={styles.loader} color="#246b52" /> :
          <FlatList
            style={styles.list}
            data={history}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messages}
            ListEmptyComponent={<View style={styles.empty}>
              <Text style={styles.section}>Start with a question</Text>
              <Text style={styles.subtitle}>Your saved exchanges will appear here. Demo replies are labeled until an AI provider is connected.</Text>
            </View>}
            renderItem={({ item }) => <View style={styles.card}>
              <Text style={styles.prompt}>{item.prompt}</Text>
              <Text style={styles.reply}>{item.reply}</Text>
              <Text style={styles.badge}>{item.provider === 'demo' ? 'DEMO RESPONSE' : item.provider.toUpperCase()}</Text>
            </View>}
          />}
        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Message to Aitrainer"
            style={styles.input}
            placeholder="What would you like help with?"
            placeholderTextColor="#66756e"
            value={message} onChangeText={setMessage}
            maxLength={4000} multiline editable={!sending}
          />
          <Pressable
            accessibilityRole="button" accessibilityLabel="Send message"
            disabled={!message.trim() || sending || loading}
            style={[styles.button, (!message.trim() || sending || loading) && styles.disabled]}
            onPress={() => void send()}
          >
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send</Text>}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f3f6f1' },
  content: { flex: 1, width: '100%', maxWidth: 780, alignSelf: 'center', padding: 24, paddingTop: 64, paddingBottom: 36 },
  eyebrow: { color: '#246b52', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  title: { fontSize: 42, fontWeight: '700', color: '#182d23', marginTop: 8 },
  subtitle: { color: '#66756e', fontSize: 15, lineHeight: 23, marginTop: 8 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 16 },
  section: { fontSize: 17, fontWeight: '600', color: '#182d23' },
  link: { color: '#246b52', padding: 8 },
  error: { color: '#a32525', backgroundColor: '#fcebea', padding: 12, borderRadius: 10, marginBottom: 12 },
  list: { flex: 1 },
  loader: { flex: 1 },
  messages: { paddingBottom: 16, gap: 12 },
  empty: { backgroundColor: '#e8eee4', padding: 24, borderRadius: 18, marginTop: 12 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, gap: 12 },
  prompt: { fontWeight: '600', fontSize: 16, color: '#182d23' },
  reply: { fontSize: 15, lineHeight: 23, color: '#43564a' },
  badge: { fontSize: 10, letterSpacing: 1, color: '#246b52', fontWeight: '600' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 16 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, fontSize: 15, minHeight: 54, maxHeight: 140, color: '#182d23' },
  button: { backgroundColor: '#246b52', borderRadius: 16, height: 54, minWidth: 74, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
