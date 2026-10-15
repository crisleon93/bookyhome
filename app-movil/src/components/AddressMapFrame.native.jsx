import React, { forwardRef } from 'react';
import { WebView } from 'react-native-webview';

const AddressMapFrame = forwardRef(({ html, onMessage, onError }, ref) => (
  <WebView
    ref={ref}
    source={{ html }}
    onMessage={onMessage}
    javaScriptEnabled
    domStorageEnabled
    originWhitelist={['*']}
    onError={onError}
  />
));

export default AddressMapFrame;
