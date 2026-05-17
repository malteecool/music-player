import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { THUMB_W, THUMB_H } from './VideoRow';

type BoxProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function SkeletonBox({
  width = '100%',
  height = 14,
  borderRadius = radii.sm,
  style,
}: BoxProps) {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        // eslint-disable-next-line react-native/no-inline-styles
        { width: width as ViewStyle['width'], height, borderRadius, backgroundColor: colors.surfaceHighlight },
        { opacity },
        style,
      ]}
    />
  );
}

export function SkeletonVideoRow() {
  return (
    <>
      <View style={styles.row}>
        <SkeletonBox
          width={THUMB_W}
          height={THUMB_H}
          borderRadius={radii.sm}
          style={styles.thumb}
        />
        <View style={styles.info}>
          <SkeletonBox width="86%" height={13} style={styles.line1} />
          <SkeletonBox width="52%" height={11} />
        </View>
      </View>
      <View style={styles.sep} />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  thumb: {
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  line1: {
    marginBottom: 7,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md + THUMB_W + spacing.md,
  },
});
