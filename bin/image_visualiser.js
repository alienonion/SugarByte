/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var soil = ee.Image("users/balddinosaur/soil/Soils_Wet_Tropics_nodata"),
    elevation = ee.Image("users/balddinosaur/elevation/DEM_Wet_Tropics_int");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/**
 * @fileoverview Visualiser tool for displaying NDVI imagery on the map.
 * Explicit functionality is offered by the exported functions, while the
 * script internally handles differing variable types and amounts provided by them.
 */

// Manager
var manager = {};
// timezone constant, may wish to migrate to app constants later
var TIMEZONE = 'Australia/Brisbane';

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

/**
 * Initialises the paddock inspector UI widget.
 * Does not add the inspector to the root.ui here, since that is only
 * done when the first paddock is selected.
 */
exports.initialise = function(app) {
  debug.info('Initialising imageVisualiser');
  // Grab a reference to the app
  manager.app = app;
  // Managed list of NDVI imagery layers. Used to remove them all from map when asked to.
  manager.ndviEleSoilLayers = [];
  // the elevation layer
  manager.elevationLayer = null;

};


/**
 * Removes all NDVI imagery layers from the map.
 */
exports.clearAllNdviLayers = function() {
  // Mappable function that removes the given layer from the Map Interface
  var removeFromMap = function(layer) {
    Map.remove(layer);
  };
  // Remove all layers
  manager.ndviEleSoilLayers.map(removeFromMap);
  // Reset list
  manager.ndviEleSoilLayers = [];
};

/**
 * Clear the layer of current information panel
 */
exports.clearCurrentNdviLayer = function (currentLayer) {
  // remove current layer when closing a information panel
  Map.remove(currentLayer);
  var layerIndex = manager.ndviEleSoilLayers.indexOf(currentLayer);
  manager.ndviEleSoilLayers.splice(layerIndex, 1);
  debug.info("remove current layer", currentLayer)
};

/**
 * Finds a collection of images that intersect any of the given features within the given date range.
 *
 * @param {String} start - The start of the date range.
 * @param {String} end - The end of the date range.
 * @param {ee.FeatureCollection} paddocks - The paddocks to display imagery for.
 *
 * @return {ee.ImageCollection} - Any image from app.dataset that intersects any
 *      of the given features within the given date range.
 */
var getImagery = function(start, end, paddocks) {
  // Get image(s) that intersect paddocks on the given date
  return ee.ImageCollection(manager.app.dataset).filterBounds(paddocks).filterDate(start, end);
};

/**
 * Displays NDVI imagery for each given feature on the given date.
 * Only imagery on the given date will be used. Thus this should only be used when
 * you're already sure the given paddocks have imagery available on the given date.
 *
 * @param {String} date - The date to display imagery for. Form: yyyy-mm-dd
 * @param {ee.Feature | ee.FeatureCollection} paddocks - The paddock(s) to display imagery for.
 *      Pass app.paddocks to display imagery for all paddocks.
 * @param {String} layerName - The name of the layer to be added to the map.
 * @param {boolean} clipToPaddocks - Whether or not to clip the imagery to the paddock geometries.
 *
 * @return {ui.Map.Layer} The layer that was created and added to the Map.
 */
exports.displayPaddockNDVIOnDate = function(date, paddocks, layerName, clipToPaddocks) {
  // Cast singular features to collections
  var paddockCollection = ee.FeatureCollection(paddocks);
  // Create a date range of a single day around the given date using  the global timezone
  var inputDay = ee.Date(date).getRange('day', TIMEZONE);
  // Find imagery
  var images = ee.ImageCollection(getImagery(inputDay.start(), inputDay.end(), paddockCollection));
  // Reduce to latest values
  var latest = images.mosaic();
  if (clipToPaddocks) {
    latest = latest.clipToCollection(paddockCollection);
  }
  // Display on Map
  var layer = Map.addLayer(latest, manager.app.vis, layerName);
  manager.ndviEleSoilLayers.push(layer);
  return layer;
};

/**
 * Displays NDVI imagery for paddocks as a median of pixel values accross a date range.
 *
 * @param {String} start - The start of the date range.
 * @param {String} end - The end of the date range.
 * @param {ee.Feature | ee.FeatureCollection} paddocks - The paddock(s) to display imagery for.
 *      Pass app.paddocks to display imagery for all paddocks.
 * @param {String} layerName - The name of the layer to be added to the map.
 * @param {boolean} clipToPaddocks - Whether or not to clip the imagery to the paddock geometries.
 *
 * @return {ui.Map.Layer} The layer that was created and added to the Map.
 */
exports.displayPaddockNDVIMedian = function(start, end, paddocks, layerName, clipToPaddocks) {
  // Cast singular features to collections
  var paddockCollection = ee.FeatureCollection(paddocks);
  // Find imagery
  var images = ee.ImageCollection(getImagery(start, end, paddocks));
  // Reduce to median values
  var median = images.median();
  if (clipToPaddocks) {
    median = median.clipToCollection(paddockCollection);
  }
  // Display on Map
  var layer = Map.addLayer(median, manager.app.vis, layerName);
  manager.ndviEleSoilLayers.push(layer);
  return layer;
};

/**
 * Displays elavation imagery for paddocks.
 *
 * @param {ee.Feature | ee.FeatureCollection} paddocks - The paddock(s) to display imagery for.
 *      Pass app.paddocks to display imagery for all paddocks.
 * @param {String} layerName - The name of the layer to be added to the map.
 * @param {boolean} clipToPaddocks - Whether or not to clip the imagery to the paddock geometries.
 *
 * @return {ui.Map.Layer} The layer that was created and added to the Map.
 */
exports.displayElevation = function(paddocks, layerName, clipToPaddocks) {
  // Cast singular features to collections
  var paddockCollection = ee.FeatureCollection(paddocks);
  // import digital elevation date
  var elevationImage = elevation;
  // the elevation layer parameters
  var visParams = {bands: ['b1'], min: 0, max: 100, palette: ['#1e7a00', '#66b100', '#dff100','#f1c90d',
          '#ffc623', '#ffa114','#ff5a0c'], shown: false};

  // Whether or not to clip the imagery to the paddock geometries
  if (clipToPaddocks) {
    var elevationOfPaddocks = elevationImage.clipToCollection(paddockCollection);
  }

  var layer = Map.addLayer(elevationOfPaddocks, visParams, layerName);

  //add elevation layers to ndviEleSoilLayers list so it can be removed when remove ndvi layers
  manager.ndviEleSoilLayers.push(layer);
  return layer;
}

/**
 * Displays elavation imagery for paddocks.
 *
 * @param {ee.Feature | ee.FeatureCollection} paddocks - The paddock(s) to display imagery for.
 *      Pass app.paddocks to display imagery for all paddocks.
 * @param {String} layerName - The name of the layer to be added to the map.
 * @param {boolean} clipToPaddocks - Whether or not to clip the imagery to the paddock geometries.
 *
 * @return {ui.Map.Layer} The layer that was created and added to the Map.
 */
exports.displaySoil = function(paddocks, layerName, clipToPaddocks) {
  // Cast singular features to collections
  var paddockCollection = ee.FeatureCollection(paddocks);
  // import digital elevation date
  var soilImage = soil;
  // the elevation layer parameters
  var visParams = {bands: ['b1'], min: 4, max: 39, palette: ['#7a6f64', '#879c8d'], shown: false};

  // Whether or not to clip the imagery to the paddock geometries
  if (clipToPaddocks) {
    var soilOfPaddocks = soilImage.clipToCollection(paddockCollection);
  }

  var layer = Map.addLayer(soilOfPaddocks, visParams, layerName);

  //add elevation layers to ndviEleSoilLayers list so it can be removed when remove ndvi layers
  manager.ndviEleSoilLayers.push(layer);
  return layer;
}