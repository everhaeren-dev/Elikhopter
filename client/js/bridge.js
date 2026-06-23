// Talks to After Effects when running inside UXP, falls back to a
// mock so the panel runs standalone in a regular browser for dev.
const AEBridge = (() => {
  const runningInUXP = typeof require === "function" && (() => {
    try {
      require("uxp");
      return true;
    } catch (e) {
      return false;
    }
  })();

  async function getSelectedPropertyKeyframes() {
    if (!runningInUXP) {
      // Mock data shaped like what host/keyframes.jsx will return.
      return [
        { time: 0, value: 0 },
        { time: 1, value: 50 },
        { time: 2, value: 20 },
        { time: 3, value: 100 },
      ];
    }
    return callHost("getSelectedPropertyKeyframes", []);
  }

  async function applyCurveToSelectedProperty(curveSamples) {
    if (!runningInUXP) {
      console.log("[mock] would apply curve, samples:", curveSamples.length);
      return true;
    }
    return callHost("applyCurveToSelectedProperty", [JSON.stringify(curveSamples)]);
  }

  // Bridges to host/keyframes.jsx, which UXP runs through the
  // ExtendScript engine. Adjust to the exact UXP-for-AE host API
  // (e.g. require("uxp").host.eval, or the AE scripting bridge)
  // once wired against a real plugin install — the call shape
  // varies slightly by AE UXP SDK version.
  async function callHost(fnName, args) {
    const { app } = require("uxp");
    const script = `${fnName}(${args.map((a) => `'${a}'`).join(",")})`;
    const result = await app.executeAsExtendScript
      ? app.executeAsExtendScript(script)
      : require("uxp").host.eval(script);
    return JSON.parse(result);
  }

  return { runningInUXP, getSelectedPropertyKeyframes, applyCurveToSelectedProperty };
})();
