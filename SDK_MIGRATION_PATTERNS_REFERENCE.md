# WazeWrap Full Version → SDK Migration Patterns Reference

**Archive of detailed migration examples from WazeWrap v2.x Full version to WME SDK equivalents**

> **Status:** Reference material for scripts still using deprecated WazeWrap Full version features  
> **Created:** April 16, 2026  
> **Applies to:** WazeWrap v2.x → v3.0 migration (Full version consolidation)

---

## Overview

WazeWrap v3.0 consolidates to alerts and update monitoring only. This document archives detailed migration patterns for the 8 feature modules that were removed, showing:

1. How they were implemented in v2.x (W object, OpenLayers)
2. Modern alternatives (WME SDK, Turf.js, native JS)
3. Code examples for each migration path

**Use this when:**
- Scripts are still using WazeWrap Full version features
- You need reference implementations for specific modules
- You're migrating a legacy script to modern APIs

---

## Feature Modules & Migration Paths

### 1. Map Model (`WazeWrap.Model.*`)

**v2.x Implementation** (deprecated — W object being phased out):
```javascript
const streetID = WazeWrap.Model.getPrimaryStreetID(segmentID);
const nodeID = WazeWrap.Model.getSelectedNodeID();
const selectedSegments = WazeWrap.Model.getSelectedSegments();
```

**v3.0+ Migration** (WME SDK):
```javascript
const sdk = getWmeSdk({ scriptName: 'YourScript', scriptId: 'yscript' });

// Get segment and access primaryStreetId property
const segment = sdk.DataModel.Segments.getById({ segmentId: segmentID });
const primaryStreetId = segment?.primaryStreetId;

// Get street by ID
const street = sdk.DataModel.Streets.getById({ streetId: primaryStreetId });
const streetName = street?.name;

// Get selected objects (via Editing module)
const selection = sdk.Editing.getSelection();

// Selection is a discriminated union - check objectType to know what's selected
if (!selection) {
  console.log('Nothing selected');
} else if (selection.objectType === 'segment') {
  const selectedSegmentIds = selection.ids; // number[]
  console.log('Segments selected:', selectedSegmentIds);
} else if (selection.objectType === 'venue') {
  const selectedVenueIds = selection.ids; // string[]
  console.log('Venues selected:', selectedVenueIds);
} else if (selection.objectType === 'node') {
  const selectedNodeIds = selection.ids; // number[]
  console.log('Nodes selected:', selectedNodeIds);
}
```

**Key Difference:** The SDK exposes **properties** on data model objects (e.g., `segment.primaryStreetId`), not methods like `getPrimaryStreetID()`.

**SDK Reference:**
- `DataModel.Segments.getById()` — Returns Segment with `primaryStreetId` property
- `DataModel.Streets.getById()` — Returns Street with `name` property  
- `Editing.getSelection()` — Returns discriminated union with `objectType` and `ids` properties

---

### 2. Geometry (`WazeWrap.Geometry.*`)

**v2.x Implementation** (deprecated — OpenLayers being phased out):
```javascript
const distance = WazeWrap.Geometry.getDistance(point1, point2);
const area = WazeWrap.Geometry.getPolygonArea(coords);
```

**v3.0+ Migration** (Turf.js — already available in WME):
```javascript
// Distance between two points (in meters)
const distance = turf.distance(point1, point2, { units: 'meters' });

// Polygon area (in square meters)
const area = turf.area(polygon);
```

### ⚠️ CRITICAL: Coordinate System Change

- **v2.x (W object / OpenLayers):** Web Mercator (EPSG:3857, aka EPSG:900913)
- **SDK / Turf.js:** WGS84 (EPSG:4326) — standard latitude/longitude

**SDK data always returns WGS84 coordinates:**
```javascript
// From SDK (WGS84)
const segment = sdk.DataModel.Segments.getById({ segmentId: 123 });
console.log(segment.geometry); // LineString with [lon, lat] in WGS84

// Direct to Turf (expects WGS84)
const distance = turf.distance(
  turf.point(segment.geometry.coordinates[0]),
  turf.point(segment.geometry.coordinates[1]),
  { units: 'meters' }
);
// ✅ Correct — both are WGS84
```

If you were converting coordinates in v2.x code, **remove those conversions** — SDK returns WGS84 directly.

**Resources:**
- [Turf.js Documentation](https://turfjs.org/)
- Turf requires an explicit @require statement: `// @require https://cdn.jsdelivr.net/npm/@turf/turf@7/turf.min.js`
- All SDK geometry (segments, nodes, venues) uses WGS84

---

### 3. Events (`WazeWrap.Events.*`)

**v2.x Implementation** (deprecated — W object being phased out):
```javascript
WazeWrap.Events.register('moveend', context, handler);
WazeWrap.Events.register('zoomend', context, handler);
WazeWrap.Events.register('selectionchanged', context, handler);
```

**v3.0+ Migration** (WME SDK):
```javascript
const sdk = getWmeSdk({ scriptName: 'YourScript', scriptId: 'yscript' });

// Map movement events
sdk.Events.on({
  eventName: 'wme-map-move-end',
  eventHandler: () => {
    console.log('Map movement finished');
  }
});

// Zoom events
sdk.Events.on({
  eventName: 'wme-map-zoom-changed',
  eventHandler: () => {
    console.log('Zoom level changed');
  }
});

// Selection events
sdk.Events.on({
  eventName: 'wme-selection-changed',
  eventHandler: () => {
    console.log('Selection changed');
  }
});

// Mouse events on map
sdk.Events.on({
  eventName: 'wme-map-mouse-up',
  eventHandler: () => {
    console.log('Mouse released on map');
  }
});

// Wait for WME to be fully ready (one-time event)
sdk.Events.once({ eventName: 'wme-ready' }).then(() => {
  console.log('WME initialized, logged in, and map data loaded');
});
```

**Key Differences:**

- Use `.on()` method, NOT `.subscribe()`
- Event names have `wme-` prefix (e.g., `'wme-map-move-end'`, not `'moveend'`)
- Third parameter (context) is not needed in SDK version
- Use `.once()` for one-time events

**Event Name Mappings (v2.x → v3.0):**

- `'moveend'` → `'wme-map-move-end'`
- `'zoomend'` → `'wme-map-zoom-changed'`
- `'mousemove'` → `'wme-map-mouse-move'`
- `'mouseup'` → `'wme-map-mouse-up'`
- `'mousedown'` → `'wme-map-mouse-down'`
- `'selectionchanged'` → `'wme-selection-changed'`

**Layer & Feature Events (v3.0 SDK only):**

```javascript
// Layer checkbox toggled (custom layers)
sdk.Events.on({
  eventName: 'wme-layer-checkbox-toggled',
  eventHandler: (layerInfo) => {
    console.log(`Layer ${layerInfo.layerName} toggled`);
  }
});

// Mouse enters a feature on a custom layer
sdk.Events.on({
  eventName: 'wme-layer-feature-mouse-enter',
  eventHandler: (featureInfo) => {
    console.log('Mouse entered feature:', featureInfo);
  }
});

// Mouse leaves a feature on a custom layer
sdk.Events.on({
  eventName: 'wme-layer-feature-mouse-leave',
  eventHandler: (featureInfo) => {
    console.log('Mouse left feature:', featureInfo);
  }
});

// Base map layer changed (satellite, hybrid, etc.)
sdk.Events.on({
  eventName: 'wme-map-layer-changed',
  eventHandler: () => {
    console.log('Base map layer changed');
  }
});
```

These events are useful for:

- Monitoring layer visibility changes
- Reacting to user interactions with custom layer features
- Detecting map display mode changes

---

### 4. User Data (`WazeWrap.User.*`)

**v2.x Implementation** (deprecated — W object being phased out):
```javascript
const username = WazeWrap.User.getName();
const rank = WazeWrap.User.getRank();
const userID = WazeWrap.User.getUserID();
const isCM = WazeWrap.User.isCM();
```

**v3.0+ Migration** (WME SDK):
```javascript
const sdk = getWmeSdk({ scriptName: 'YourScript', scriptId: 'yscript' });

// Get user session info
const userSession = sdk.State.getUserInfo();

// Access user properties (UserSession interface)
const username = userSession?.userName;           // NOT displayName
const rank = userSession?.rank;
const isCountryManager = userSession?.isCountryManager;
const isAreaManager = userSession?.isAreaManager;

// Check if logged in
const isLoggedIn = sdk.State.isLoggedIn();

// v2.x isCM() equivalent
const isCM = userSession?.isCountryManager ?? false;
```

**Key Differences:**

- Use `sdk.State`, NOT `sdk.User`
- Method is `getUserInfo()`, NOT `getUser()`
- Property is `userName`, NOT `displayName`
- Use `isCountryManager` boolean property instead of `isCM()` method
- Use `isAreaManager` for area manager check

**UserSession Properties Available:**

- `userName: string`
- `rank: UserRank`
- `isCountryManager: boolean`
- `isAreaManager: boolean`
- `managedAreas: ManagedAreaShort[]`

---

### 5. Script Dependency Loading (`WazeWrap.Require.*`)

**v2.x Implementation:**
```javascript
WazeWrap.Require.css('https://example.com/style.css');
WazeWrap.Require.lib('https://example.com/lib.js', 'myLib');
```

**v3.0+ Migration (Direct DOM):**

**Loading CSS:**
```javascript
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://example.com/style.css';
document.head.appendChild(link);
```

**Loading JavaScript:**
```javascript
const script = document.createElement('script');
script.src = 'https://example.com/lib.js';
document.head.appendChild(script);

// Optional: wait for script to load
script.onload = () => {
  console.log('Library loaded');
};
```

**v3.0+ Migration (Build Tool Approach):**

Use a build tool (Webpack, Rollup, Vite) to bundle dependencies:
```javascript
import styles from './styles.css';
import myLib from './lib.js';

// Use myLib directly
```

---

### 6. String Utilities (`WazeWrap.String.*`)

**v2.x Implementation:**
```javascript
const trimmed = WazeWrap.String.trim(text);
const uppercase = WazeWrap.String.toUpperCase(text);
const lowercase = WazeWrap.String.toLowerCase(text);
```

**v3.0+ Migration (Native JS):**
```javascript
// All operations use native JavaScript methods
const trimmed = text.trim();
const uppercase = text.toUpperCase();
const lowercase = text.toLowerCase();
```

**All common string operations are built into JavaScript now.** No library needed.

---

### 7. Utility Helpers (`WazeWrap.Util.*`)

**v2.x Implementation:**
```javascript
const hexColor = WazeWrap.Util.toHexColor(rgb);
const randomID = WazeWrap.Util.generateID();
```

**v3.0+ Migration (Native JS):**

**RGB to Hex:**
```javascript
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
const hexColor = rgbToHex(255, 100, 50); // "#ff6432"
```

**Generate Random ID:**
```javascript
const randomID = Math.random().toString(36).substr(2, 9);
```

---

### 8. Remote API Calls (`WazeWrap.Remote.*`)

**v2.x Implementation** (deprecated endpoint):
```javascript
WazeWrap.Remote.APICall(
  new WazeWrap.Remote.Procedures.FetchSegmentInfo({ id: segmentID }),
  function(result) {
    console.log('Segment:', result);
  }
);
```

**v3.0+ Migration (WME SDK):**
```javascript
const sdk = getWmeSdk({ scriptName: 'YourScript', scriptId: 'yscript' });

// SDK-based approach
const result = await sdk.DataModel.segment.fetch(segmentID);
console.log('Segment:', result);
```

**v3.0+ Migration (Fetch API):**
```javascript
const response = await fetch('/api/segments/' + segmentID);
const result = await response.json();
console.log('Segment:', result);
```

---

## Migration Checklist

For each script using WazeWrap v2.x Full version:

- [ ] **Audit:** List all `WazeWrap.*` calls in your script
- [ ] **Categorize:** Identify which modules they belong to (Model, Geometry, etc.)
- [ ] **Prioritize:**
  - Alerts/Update Monitor only? ✅ Direct v3.0 upgrade, no code changes
  - Other modules? ⚠️ Requires implementation of migration paths below
- [ ] **Implement:** Replace each `WazeWrap.*` call with migration pattern
- [ ] **Test:** Verify functionality in WME thoroughly
- [ ] **Update Metadata:**
  - Replace v2.x `@require` with v3.0 (which replaces 2.x versions)
  - Update version number
  - Document changes in changelog
- [ ] **Publish:** Release updated version

---

## Recommended Migration Approach

### Tier 1: Immediate (for alerts-only scripts)
- ✅ No code changes needed
- Simply update `@require` to point to v3.0
- Your script continues working unchanged

### Tier 2: Medium (for scripts using Model/Geometry/Events)
- 🔄 Identify specific `WazeWrap.*` calls
- 🔄 Replace with WME SDK equivalents (see migration paths above)
- 🔄 Test thoroughly in WME
- Estimated effort: 1-2 hours per module

### Tier 3: Long-term (for heavily customized scripts)
- 🔧 Consider migrating to full WME SDK ecosystem
- 🔧 Use modern build tools (Webpack, TypeScript)
- 🔧 Contribute useful utilities back to WazeDev community
- Estimated effort: 4-8 hours depending on scope

---

