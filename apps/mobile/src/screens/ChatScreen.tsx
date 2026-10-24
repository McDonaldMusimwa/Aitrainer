import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { colors } from '../theme';
import { Exchange, getHistory, sendMessage } from '../api';

type PendingReply = { prompt: string; reply: string; failed?: boolean };
type ListItem = Exchange & { failed?: boolean };

function badge(item: ListItem) {
  if (item.id !== 'pending') return item.provider === 'demo' ? 'DEMO RESPONSE' : item.provider.toUpperCase();
  return item.failed ? 'INCOMPLETE — NOT SAVED' : 'WRITING…';
}

export default function ChatScreen() {
  const [history, setHistory] = useState<Exchange[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<PendingReply | null>(null);

  async function refresh() {
    setLoading(true);
    setError('');
    setPending(null);
    try { setHistory(await getHistory()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load history.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, []);

  async function send() {
    if (!message.trim() || sending || loading) return;
    const prompt = message.trim();
    setSending(true);
    setError('');
    setPending({ prompt, reply: '' });
    try {
      const exchange = await sendMessage(prompt, text =>
        setPending(current => current && { ...current, reply: current.reply + text }));
      setHistory(current => [exchange, ...current]);
      setPending(null);
      setMessage('');
    } catch (err) {
      // Keep whatever was already written visible next to the error.
      setPending(current => current && { ...current, failed: true });
      setError(err instanceof Error ? err.message : 'Could not send your message.');
    } finally { setSending(false); }
  }

  const items: ListItem[] = pending
    ? [{ id: 'pending', provider: '', created_at: '', ...pending }, ...history]
    : history;

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
        {loading ? <ActivityIndicator style={styles.loader} color={colors.ink} /> :
          <FlatList
            inverted
            style={styles.list}
            data={items}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messages}
            ListEmptyComponent={<View style={styles.empty}>
              <Text style={styles.section}>Start with a question</Text>
              <Text style={styles.subtitle}>Your saved exchanges will appear here. Demo replies are labeled until an AI provider is connected.</Text>
            </View>}
            renderItem={({ item }) => <View style={styles.card}>
              <Text style={styles.prompt}>{item.prompt}</Text>
              {item.reply ? <Text style={styles.reply}>{item.reply}</Text>
                : item.failed ? null
                : <View style={styles.thinking}>
                  <ActivityIndicator size="small" color={colors.muted} />
                  <Text style={styles.reply}>Thinking…</Text>
                </View>}
              <Text style={styles.badge}>{badge(item)}</Text>
            </View>}
          />}
        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Message to Aitrainer"
            style={styles.input}
            placeholder="What would you like help with?"
            placeholderTextColor={colors.muted}
            value={message} onChangeText={setMessage}
            maxLength={4000} multiline editable={!sending}
          />
          <Pressable
            accessibilityRole="button" accessibilityLabel="Send message"
            disabled={!message.trim() || sending || loading}
            style={[styles.button, (!message.trim() || sending || loading) && styles.disabled]}
            onPress={() => void send()}
          >
            {sending ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.buttonText}>Send</Text>}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, width: '100%', maxWidth: 780, alignSelf: 'center', padding: 24, paddingTop: 64, paddingBottom: 36 },
  eyebrow: { color: colors.ink, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  title: { fontSize: 42, fontWeight: '700', color: colors.ink, marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 8 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 16 },
  section: { fontSize: 17, fontWeight: '600', color: colors.ink },
  link: { color: colors.ink, padding: 8 },
  error: { color: colors.error, backgroundColor: colors.errorBackground, padding: 12, borderRadius: 10, marginBottom: 12 },
  list: { flex: 1 },
  loader: { flex: 1 },
  messages: { paddingBottom: 16, gap: 12 },
  empty: { backgroundColor: colors.secondary, padding: 24, borderRadius: 18, marginTop: 12 },
  card: { backgroundColor: colors.surface, padding: 20, borderRadius: 16, gap: 12 },
  prompt: { fontWeight: '600', fontSize: 16, color: colors.ink },
  reply: { fontSize: 15, lineHeight: 23, color: colors.muted },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { fontSize: 10, letterSpacing: 1, color: colors.ink, fontWeight: '600' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 16 },
  input: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16, fontSize: 15, minHeight: 54, maxHeight: 140, color: colors.ink },
  button: { backgroundColor: colors.primary, borderRadius: 16, height: 54, minWidth: 74, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
  buttonText: { color: colors.primaryForeground, fontWeight: '600' },
});
