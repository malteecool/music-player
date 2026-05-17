import { useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import type WebViewType from 'react-native-webview';
import { Config } from '../config';

type Props = {
  videoId: string;
  width: number;
  height: number;
  play: boolean;
  onEnd?: () => void;
  onStateChange?: (state: string) => void;
};

// Removes the "Version/4.0" WebView fingerprint that YouTube detects and blocks.
const CHROME_UA =
  'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

const YT_STATE_NAMES: Record<string, string> = {
  unstarted: 'unstarted',
  ended: 'ended',
  playing: 'playing',
  paused: 'paused',
  buffering: 'buffering',
  cued: 'video cued',
};

export default function YouTubePlayer({ videoId, width, height, play, onEnd, onStateChange }: Props) {
  const webViewRef = useRef<WebViewType>(null);

  useEffect(() => {
    webViewRef.current?.injectJavaScript(play ? 'play(); true;' : 'pause(); true;');
  }, [play]);

  const handleMessage = ({ nativeEvent }: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(nativeEvent.data);
      if (data.type === 'stateChange') {
        onStateChange?.(YT_STATE_NAMES[data.state] ?? data.state);
        if (data.state === 'ended') onEnd?.();
      }
    } catch {}
  };

  const uri = `${Config.PLAYER_BASE_URL}?v=${videoId}&autoplay=${play ? 1 : 0}`;

  return (
    <WebView
      key={videoId}
      ref={webViewRef}
      source={{ uri }}
      style={{ width, height, backgroundColor: '#000' }}
      userAgent={CHROME_UA}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      onMessage={handleMessage}
    />
  );
}
