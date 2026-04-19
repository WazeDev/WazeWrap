# WazeWrap v3.0 Migration Guide

For users upgrading from WazeWrap v2.x

> **New to v3.0?** See [README.md](README.md) for the complete API reference and usage examples.

---

## What Changed

WazeWrap v3.0 consolidates to a lightweight library focused on the most-used features:

- **Kept:** Alerts and script update monitoring
- **Removed:** Map model, geometry, events, user data, string utilities, utility helpers, remote API calls
- **Result:** Future-proof, maintainable, aligned with modern WME

### Why the Change?

**The W object and OpenLayers (OL) are being phased out by WME.** The v2.x Full version relied on these legacy APIs, which will eventually stop working. By consolidating to the lightweight version and recommending the **WME SDK**, we ensure your scripts:

- Continue working as WME evolves
- Use official, maintained APIs
- Reduce technical debt
- Follow WazeDev best practices

---

## What's in v3.0?

WazeWrap v3.0 includes:

- **Alerts API:** `.success()`, `.info()`, `.warning()`, `.error()`, `.debug()`, `.confirm()`, `.prompt()`
- **Script Update Monitoring:** `ScriptUpdateMonitor` class for automatic update checking
- **Update Dashboard:** `Interface.ShowScriptUpdate()` for displaying updates

For complete API reference with parameters and examples, see [README.md](README.md).

---

## Migration by Feature

All v2.x features were built on deprecated APIs (W object, OpenLayers). Here's how to migrate to modern alternatives:

### Map Model (`WazeWrap.Model.*`) → WME SDK

```javascript
// v2.x (W object - deprecated)
const streetID = WazeWrap.Model.getPrimaryStreetID();

// v3.0 - use WME SDK
const sdk = getWmeSdk({ scriptName: 'YourScript', scriptId: 'yscript' });
const streetID = sdk.DataModel.street.getPrimaryStreetID?.();
```

### Geometry (`WazeWrap.Geometry.*`) → Turf.js

```javascript
// v2.x (OpenLayers-based - deprecated)
const distance = WazeWrap.Geometry.getDistance(point1, point2);

// v3.0 (Turf.js - modern alternative)
const distance = turf.distance(point1, point2, { units: 'meters' });
```

[Turf.js docs](https://turfjs.org/)

### Events (`WazeWrap.Events.*`) → WME SDK

```javascript
// v2.x (W object - deprecated)
WazeWrap.Events.register('map.click', function() { /* ... */ });

// v3.0 (WME SDK)
const sdk = getWmeSdk({ scriptName: 'YourScript', scriptId: 'yscript' });
sdk.Events.subscribe('map.click', (e) => { /* ... */ });
```

### User Data (`WazeWrap.User.*`) → WME SDK

```javascript
// v2.x (W object - deprecated)
const username = WazeWrap.User.getName();

// v3.0 (WME SDK)
const sdk = getWmeSdk({ scriptName: 'YourScript', scriptId: 'yscript' });
const username = sdk.User.getUser()?.displayName;
```

### Dependencies (`WazeWrap.Require.*`) → Manual or Build Tools

```javascript
// v2.x
WazeWrap.Require.css('https://example.com/style.css');

// v3.0 - Create elements directly
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://example.com/style.css';
document.head.appendChild(link);
```

Or use a build tool (Webpack, Rollup, Vite) to bundle dependencies.

### String/Utility Helpers → Native JS

```javascript
// v2.x
const trimmed = WazeWrap.String.trim(text);

// v3.0 - use native methods
const trimmed = text.trim();
```

### Remote API Calls (`WazeWrap.Remote.*`) → Fetch API or WME SDK

```javascript
// v2.x (deprecated endpoint)
WazeWrap.Remote.APICall(new WazeWrap.Remote.Procedures.FetchSegmentInfo({ id: segmentID }), callback);

// v3.0 (Fetch API)
const result = await fetch('/api/segments/' + segmentID);
```

---

## Do You Need to Migrate?

**If your script only uses `Alerts` or `ScriptUpdateMonitor`:**

- ✅ No migration needed. Update `@require` to v3.0.
- Your code will work unchanged.
- For initialization details, see [README: Wait for Initialization](README.md#2-wait-for-initialization).

**If your script uses other `WazeWrap.*` features (Model, Geometry, Events, User, etc.):**

- ⚠️ **Critical:** These features rely on deprecated W object and OpenLayers APIs that WME is phasing out.
- Your scripts will **stop working** when WME completes the transition.
- **Migrate now** to ensure future compatibility:

1. Identify which features you're using
2. Find the equivalent in the migration paths above
3. Replace with WME SDK or standard library equivalents
4. Test in WME thoroughly
5. Update your script metadata and version number
6. Publish the update

---

## Resources

- [WME SDK Documentation](https://wazedev.github.io/) — Official WME SDK docs
- [Turf.js Documentation](https://turfjs.org/) — Geospatial library
- [WazeDev Community](https://github.com/WazeDev) — Community scripts and support

---

## Summary

WazeWrap v3.0 provides alerts and update monitoring. For map features, use WME SDK—it's official, well-maintained, and modern.
