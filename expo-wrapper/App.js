
import React, { useState, useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, View, ActivityIndicator, Text, SafeAreaView } from 'react-native';

// Public tunnel URL (localtunnel) — used as the single URL for the WebView.
// Replaced automatically by the automation. If you want to change it later,
// update the value below.
const WEB_URL = 'https://some-gifts-eat.loca.lt';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUrl] = useState(WEB_URL);
  const webViewRef = useRef(null);

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    setError(`Connection failed. Last error: ${nativeEvent.description}`);
    setLoading(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
    setError(null);
    console.log(`✓ Successfully loaded from: ${currentUrl}`);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#0a7ea4" />
            <Text style={styles.loadingText}>Loading HR System...</Text>
            <Text style={styles.urlText}>Loading: {currentUrl}</Text>
          </View>
        )}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Connection Failed</Text>
            <Text style={styles.retryText}>{error}</Text>
            <Text style={styles.retryText}>URL: {currentUrl}</Text>
            <Text style={styles.retryText}>
              Make sure the web app (Vite) is running and accessible. If the app
              does not load on your device, run Vite with `npm run dev -- --host` or
              use a tunnel (localtunnel/ngrok) and retry.
            </Text>
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          scalePageToFit={true}
          originWhitelist={['*']}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          userAgent="Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
          decelerationRate={0.998}
          scrollEnabled={true}
          nestedScrollEnabled={true}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1000,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  urlText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  retryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  urlListText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'monospace',
  },
});
