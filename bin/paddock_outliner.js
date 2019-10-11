/**
 * @fileoverview This script contains functions for 
 * rendering one or more feature collections on to the map as outlines.
 */

var manager = {};

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

/**
 * Instantiate the paddock outline visualiser tool.
 * @param {Object} app - The root application object. This must be configured
 * @param {String} app.PROPERTY_SELECTED - The name of the property that flags a paddock as selected.
 * @param {ee.FeatureCollection} app.paddocks - The complete list of paddocks.
 */
exports.initialise = function(app) {
	debug.info('Initialising paddockOutliner.');
  // Save a reference to the app
  manager.app = app;
  manager.outlines = ui.Map.Layer();
  manager.selected = ui.Map.Layer();
};

// --------------------------------------------
// Module constants
// --------------------------------------------
// visParams objects for outlines.
var outlineVisParams = {
  palette:'FFFFFF'
};
var selectedVisParams = {
  palette:'FF0000'
};

// Layer titles
var LAYER_NAME_OUTLINES = 'All paddock outlines';
var LAYER_NAME_SELECTED = 'Currently selected paddock: ';

// Whether or not the outlines should be shown automatically.
// Setting these to false can speed up app performance.
var SHOWN_OUTLINES = true;
var SHOWN_SELECTED = true;

/**
 * Resets the outline layer to the current master list of paddocks.
 */
var setOutlineLayer = function() {
  debug.info('Setting the basic paddocks outline map layer.');
  // Check if the data source for paddock outlines is empty
  if (manager.app.paddocks === null) {
    return;
  }
  // Create a layer for the outlines of all recognised paddocks
  var outlinesOfPaddocks = ee.Image().paint(manager.app.paddocks, 0, 1);
  manager.outlines = ui.Map.Layer({
      eeObject: outlinesOfPaddocks, 
      visParams: outlineVisParams, 
      name: LAYER_NAME_OUTLINES,
      shown: SHOWN_OUTLINES,
  });
};

/**
 * Resets the selected layer to the current master list of selected paddocks.
 */
var setSelectedLayer = function() {
  debug.info('Setting the selected paddocks indicator map layer.');
  // Check if the data source for paddock outlines is empty
  if (manager.app.paddocks === null) {
    return;
  }
  // Filter to all the selected paddocks
  var selectedPaddocks = ee.FeatureCollection(ee.FeatureCollection(manager.app.paddocks).filterMetadata(
      manager.app.PROPERTY_SELECTED, 'equals', 1));
  debug.info('selectedPaddocks:', selectedPaddocks);
  
  //TODO: Check if this set is empty before creating a layer out of it.
  
  // Create a layer based off the currently selected paddocks
  var outlinesOfSelectedPaddocks = ee.Image().paint(selectedPaddocks, 0, 5);
  manager.selected = ui.Map.Layer({
      eeObject: outlinesOfSelectedPaddocks, 
      visParams: selectedVisParams, 
      name: LAYER_NAME_SELECTED,
      shown: SHOWN_SELECTED,
  });
};

/**
 * Resets the basic outlines of all paddocks. Does not touch the selected paddocks.
 * This should be called whenever the master of paddocks is altered.
 */
exports.refreshOutlines = function() {
  debug.info('Attempting to refresh paddock outlines.');
  // Remove the current layer of outlines. 
  // Doesn't matter if it hasn't been added to the map yet, so long as it is a Layer object.
  Map.remove(manager.outlines); 
  // Create a new layer from the master list of paddocks
  setOutlineLayer();
  // Add the layer to the map.
  debug.info('Paddock outlines layer:', manager.outlines);
  Map.add(manager.outlines); 
  debug.info('Finished refreshing paddock outlines.');
};

/**
 * Resets the outlines of all  selected paddocks. Does not touch the basic paddock outlines.
 * This should be called whenever the list of selected paddocks is altered.
 */
exports.refreshSelectedOutlines = function() {
  debug.info('Attempting to refresh selected paddock outlines.');
  // Remove the current layer of selected paddock outlines. 
  // Doesn't matter if it hasn't been added to the map yet, so long as it is a Layer object.
  Map.remove(manager.selected);
  //Create a new layer from the master list of paddocks
  setSelectedLayer();
  // Add the layer to the map.
  debug.info('Selected paddock outlines layer:', manager.selected);
  Map.add(manager.selected); 
  debug.info('Finished refreshing selected paddock outlines.');
};