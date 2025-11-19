# update_po_file Bugfix - 2025-10-22

## Problem
`update_po_file` fonksiyonu HTML ve CSS seçici içeren msgid'leri güncelleyemiyordu.

## Root Cause
`src/tools/update.ts:116` satırında yanlış msgid kullanımı:
```typescript
const msgid = entry.msgid as string;  // YANLIŞ
```

## Solution
msgidKey doğrudan kullanılmalı:
```typescript
const msgid = msgidKey;  // DOĞRU
```

## Reason
`gettext-parser` kütüphanesi object key'lerinde gerçek msgid string'ini tutuyor. `entry.msgid` field'ı internal kullanım için farklı formatta olabilir.

## Test Results
- ✅ HTML tag içeren mesajlar (`<br/>`) güncelleniyor
- ✅ CSS seçiciler (`#id`, `.class`) güncelleniyor
- ✅ Success rate: %0 → %100

## Files Changed
- `src/tools/update.ts` (line 116-117)
