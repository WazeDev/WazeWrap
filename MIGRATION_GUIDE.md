# WazeWrap v3.0 Migration Guide

**For users upgrading from WazeWrap v2.x (Full version)**

---

## What Changed

WazeWrap v3.0 is a **major consolidation** that removes Full version features in favor of simplicity and maintainability:

- **Removed:** Map model, geometry, events, user data, string utilities, utility helpers, remote API calls
- **Kept:** Alerts and script update monitoring (the most-used features)
- **New:** Cleaner, lighter codebase (~55% smaller)

### Why This Change?

The Full version (v2.x) had two parallel implementations, each requiring maintenance. By consolidating to the lightweight version (which was never released) and encouraging WME SDK adoption, we can:

1. Reduce maintenance burden
2. Provide a lightweight, focused library
3. Align with WME's official SDK
4. Keep the code modern and clean

---

## Do I Need to Migrate?

**If your script uses any of these, you must migrate:**

- `WazeWrap.Model.*` — Map model access
- `WazeWrap.Geometry.*` — Geometric operations
- `WazeWrap.Events.*` — Map events
- `WazeWrap.User.*` — User information
- `WazeWrap.Require.*` — Script dependency loading
- `WazeWrap.String.*` — String utilities (use native JS instead)
- `WazeWrap.Util.*` — Utility helpers (use native JS instead)
- `WazeWrap.Remote.*` — Remote API calls (deprecated endpoint)

**If your script only uses these, you can upgrade directly to v3.0:**

- `WazeWrap.Alerts.*` — All alert methods
- `WazeWrap.Alerts.ScriptUpdateMonitor` — Update monitoring
- `WazeWrap.Interface.ShowScriptUpdate()` — Update dashboard

---

## Migration Path by Feature

### 1. Map Model (`WazeWrap.Model.*`)

**v2.x:**
```javascript
const streetID = WazeWrap.Model.getPrimaryStreetID();
const nodeID = WazeWrap.Model.getSelectedNodeID();
const selectedSegments = WazeWrap.Model.getSelectedSegments();
```

**v3.0 (WME SDK):**
```javascript
const sdk = getWmeSdk({ scriptName: 'YourScript', scriptId: 'yscript' });

const streetID = sdk.DataModel.street.getPrimaryStreetID?.();
const nodeID = sdk.DataModel.node.getSelectedNodeID?.();
const selectedSegments = sdk.DataModel.segment.getSelectedSegmentIDs?.();
```

**Alternative:** Use the W object directly if you're comfortable with it:
```javascript
const streetID = W.model.streets.getObject(id);
```

---

### 2. Geometry (`WazeWrap.Geometry.*`)

**v2.x:**
```javascript
const distance = WazeWrap.Geometry.getDistance(point1, point2);
const area = WazeWrap.Geometry.getPolygonArea(coords);
```

**v3.0 (Turf.js):**

Turf.js is already available in WME scripts. Use it directly:

```javascript
// Distance between two points (in meters)
const distance = turf.distance(point1, point2, { units: 'meters' });

// Polygon area
const area = turf.area(polygon); // square meters
```

**Reference:** https://turfjs.org/

---

### 3. Events (`WazeWrap.Events.*`)

**v2.x:**
```javascript
WazeWrap.Events.register('map.click', function() { /* ... */ });
```

**v3.0 (WME SDK):**
```javascript
const sdk = getWmeSdk({ scriptName: 'YourScript', scriptId: 'yscript' });

sdk.Events.subscribe('map.click', (e) => { /* ... */ });
```

---

### 4. User Data (`WazeWrap.User.*`)

**v2.x:**
```javascript
const username = WazeWrap.User.getName();
const rank = WazeWrap.User.getRank();
```

**v3.0 (WME SDK):**
```javascript
const sdk = getWmeSdk({ scriptName: 'YourScript', scriptId: 'yscript' });

const username = sdk.User.getUser()?.displayName;
const rank = sdk.User.getUser()?.rank;
```

---

### 5. Script Dependency Loading (`WazeWrap.Require.*`)

**v2.x:**
```javascript
WazeWrap.Require.css('https://example.com/style.css');
WazeWrap.Require.lib('https://example.com/lib.js', 'myLib');
```

**v3.0 (Manual):**

**CSS:**
```javascript
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://example.com/style.css';
document.head.appendChild(link);
```

**JavaScript:**
```javascript
const script = document.createElement('script');
script.src = 'https://example.com/lib.js';
document.head.appendChild(script);
```

**Or use a build tool** (Webpack, Rollup, Vite) to bundle dependencies.

---

### 6. String Utilities (`WazeWrap.String.*`)

**v2.x:**
```javascript
const trimmed = WazeWrap.String.trim(text);
const uppercase = WazeWrap.String.toUpperCase(text);
```

**v3.0 (Native JS):**
```javascript
const trimmed = text.trim();
const uppercase = text.toUpperCase();
```

All common string operations are now built into JavaScript. No library needed.

---

### 7. Utility Helpers (`WazeWrap.Util.*`)

**v2.x:**
```javascript
const hexColor = WazeWrap.Util.toHexColor(rgb);
```

**v3.0 (Native JS or Lodash):**

Use native JS or a lightweight utility library like Lodash:

```javascript
// Native: RGB to Hex
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
const hexColor = rgbToHex(255, 100, 50); // "#ff6432"
```

---

### 8. Remote API Calls (`WazeWrap.Remote.*`)

**v2.x:**
```javascript
WazeWrap.Remote.APICall(
  new WazeWrap.Remote.Procedures.FetchSegmentInfo({ id: segmentID }),
  function(result) { /* ... */ }
);
```

**v3.0 (fetch API or axios):**

Use the WME SDK or fetch directly:

```javascript
const sdk = getWmeSdk({ scriptName: 'YourScript', scriptId: 'yscript' });

// Option 1: WME SDK (if available)
const result = await sdk.DataModel.segment.fetch(segmentID);

// Option 2: Fetch API
const response = await fetch('/api/segments/' + segmentID);
const result = await response.json();
```

---

## Migration Checklist

For each script using v2.x:

- [ ] List all `WazeWrap.*` calls you're using
- [ ] Check which modules they belong to (Model, Geometry, Events, etc.)
- [ ] For Alerts/Update Monitor: No change needed, upgrade to v3.0
- [ ] For other modules: Implement migration paths above
- [ ] Test in WME to verify functionality
- [ ] Update script metadata: remove v2.x `@require`, add v3.0 `@require`
- [ ] Update version number and changelog
- [ ] Publish update

---

## Recommended Approach

**Tier 1: Immediate (for alerts-only scripts)**
- Update `@require` to point to v3.0
- No code changes needed if only using Alerts and Update Monitor

**Tier 2: Medium (for scripts using Model/Geometry/Events)**
- Identify specific `WazeWrap.*` calls
- Replace with WME SDK equivalents (see migration paths above)
- Test thoroughly in WME

**Tier 3: Long-term (for heavily customized scripts)**
- Consider migrating to full WME SDK ecosystem
- Use modern build tools (Webpack, TypeScript, etc.)
- Contribu to WazeDev community if you build useful utilities

---

## Getting Help

**Questions about WME SDK?**
- WME SDK Docs: Check the official WME documentation
- WazeDev Community: Ask in WazeDev forums/Discord

**Still using v2.x features?**
- The old Full version is archived in `_archived/` (not maintained)
- You can reference old code, but no support will be provided
- Consider this a good time to modernize your script

**Found a bug in v3.0?**
- Report it on GitHub: https://github.com/WazeDev/WazeWrap/issues

---

## Summary

WazeWrap v3.0 is **simpler, lighter, and focused** on what developers actually use: alerts and update monitoring.

By moving to the WME SDK for map-related features, your scripts will:
- Be more aligned with WME's official APIs
- Have better long-term support
- Benefit from WME's regular updates
- Use modern, well-documented tools

**Thank you for using WazeWrap!**
