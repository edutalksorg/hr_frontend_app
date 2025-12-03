import 'react-native-reanimated';
import React, { useState } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, View, ActivityIndicator, Text, Platform } from 'react-native';

// Support both localhost (web/debugger) and IP address (mobile device)
// Try localhost first, fallback to IP
const WEB_URLS = [
  'http://localhost:5173',           // Web browser, localhost
  'http://127.0.0.1:5173',           // Emulator localhost
  'http://192.168.0.113:5173',       // Your machine IP (UPDATE THIS)
];

// Use the first URL (localhost) which will work for web and emulator
// For physical device, update the IP address above to your machine's IP
const WEB_URL = WEB_URLS[0];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUrl, setCurrentUrl] = useState(WEB_URL);

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    
    // Try next URL if available
    const currentIndex = WEB_URLS.indexOf(currentUrl);
    if (currentIndex < WEB_URLS.length - 1) {
      const nextUrl = WEB_URLS[currentIndex + 1];
      console.log(`Trying next URL: ${nextUrl}`);
      setCurrentUrl(nextUrl);
      setLoading(true);
      setError(null);
      return;
    }
    
    setError(`Error: ${nativeEvent.description}`);
    setLoading(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
    setError(null);
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text style={styles.loadingText}>Loading HR System...</Text>
          <Text style={styles.urlText}>From: {currentUrl}</Text>
        </View>
      )}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText}>Make sure the web app is running on port 5173</Text>
          <Text style={styles.retryText}>
            For physical device: Update IP in App.js to your machine's IP
          </Text>
          <Text style={styles.retryText}>Current URL: {currentUrl}</Text>
        </View>
      )}
      <WebView
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  urlText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  retryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});
  },
});
