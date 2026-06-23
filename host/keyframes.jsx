// Runs in AE's ExtendScript engine, invoked from bridge.js.
// Sketch only — confirm the exact UXP<->ExtendScript call shape
// against the AE UXP SDK version in use before relying on this.

function getSelectedPropertyKeyframes() {
  var prop = app.project.activeItem.selectedProperties[0];
  if (!prop || !prop.numKeys) return JSON.stringify([]);

  var keyframes = [];
  for (var i = 1; i <= prop.numKeys; i++) {
    keyframes.push({
      time: prop.keyTime(i),
      value: prop.keyValue(i),
    });
  }
  return JSON.stringify(keyframes);
}

function applyCurveToSelectedProperty(curveSamplesJSON) {
  var samples = JSON.parse(curveSamplesJSON);
  var prop = app.project.activeItem.selectedProperties[0];
  if (!prop) return JSON.stringify(false);

  app.beginUndoGroup("Elikhopter: Apply Curve");

  var duration = prop.keyTime(prop.numKeys) - prop.keyTime(1);
  var startTime = prop.keyTime(1);
  var startValue = prop.keyValue(1);
  var endValue = prop.keyValue(prop.numKeys);

  // Clear existing keys, rebuild from the normalized curve samples.
  for (var i = prop.numKeys; i >= 1; i--) prop.removeKey(i);

  for (var s = 0; s < samples.length; s++) {
    var sample = samples[s];
    var time = startTime + sample.t * duration;
    var value = startValue + sample.v * (endValue - startValue);
    prop.setValueAtTime(time, value);
  }

  app.endUndoGroup();
  return JSON.stringify(true);
}
