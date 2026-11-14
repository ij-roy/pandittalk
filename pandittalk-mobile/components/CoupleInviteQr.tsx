import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

type QrModules = {
  size: number;
  get: (row: number, col: number) => number;
};

type QrCreate = (
  text: string,
  options?: { errorCorrectionLevel?: string },
) => { modules: QrModules };

// Metro resolves the browser build, which exposes create without a canvas.
const qrcode = require('qrcode') as { create: QrCreate };

export function CoupleInviteQr({ value, size = 220 }: { value: string; size?: number }) {
  const cells = useMemo(() => {
    const qr = qrcode.create(value, { errorCorrectionLevel: 'M' });
    const count = qr.modules.size;
    const dark: { x: number; y: number }[] = [];
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (qr.modules.get(row, col)) dark.push({ x: col, y: row });
      }
    }
    return { count, dark };
  }, [value]);

  return (
    <View style={styles.frame}>
      <Svg width={size} height={size} viewBox={`0 0 ${cells.count} ${cells.count}`}>
        <Rect x={0} y={0} width={cells.count} height={cells.count} fill="#FFFFFF" />
        {cells.dark.map((cell) => (
          <Rect key={`${cell.x}-${cell.y}`} x={cell.x} y={cell.y} width={1} height={1} fill="#1C1C1C" />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    alignSelf: 'center',
  },
});
