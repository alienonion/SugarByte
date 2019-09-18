/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var elevationOfSelectedPaddocks = ee.Image("CGIAR/SRTM90_V4"),
    imageCollection = ee.ImageCollection("CSIRO/SLGA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/**
 * @fileoverview This script contains functions for 
 * rendering one or more feature collections on to the map as outlines.
 * 
 * 
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
  
  // li
  manager.elevation = ui.Map.Layer();
  // soil layer
  manager.soil = ui.Map.Layer();
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


//li 
// var elevationVisParams = {
// // black 
//   palette:'#000000'
// }

//

// Layer titles
var LAYER_NAME_OUTLINES = 'All paddock outlines';
var LAYER_NAME_SELECTED = 'Currently selected paddock: ';

// li 
var LAYER_NAME_ELEVATION = 'Elevation layer of selected paddock: ';

// soil layer title
var LAYER_NAME_SOIL = 'Soil layer: ';

// Whether or not the outlines should be shown automatically.
// Setting these to false can speed up app performance.
var SHOWN_OUTLINES = true;
var SHOWN_SELECTED = true;

// li
var SHOWN_ELEVATION= true;

// Setting soil layer to be shown automatically.
var SHOWN_SOIL = true;

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
 * Resets the soil layer to the current master list of selected paddocks.
 */
  var setSoilLayer = function() {
  debug.info('Setting the selected paddocks soil map layer.');
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
  var mosaic = ee.ImageCollection('CSIRO/SLGA')
  .filterDate('2000-01-01', '2013-05-01').mosaic();
  var soilLayerOfSelectedPaddocks = mosaic.clip(selectedPaddocks);
  manager.soil = ui.Map.Layer({
      eeObject: soilLayerOfSelectedPaddocks, 
      name: LAYER_NAME_SOIL,
      shown: SHOWN_SOIL,
  });
};



/// li 
var setElevationLayer = function() {
  // Check if the data source for paddock outlines is empty
  if (manager.app.paddocks === null) {
    return;
  }
  // Filter to all the selected paddocks
  
  
  // var selectedPaddocks = ee.FeatureCollection(ee.FeatureCollection(manager.app.paddocks).filterMetadata(
  //     manager.app.PROPERTY_SELECTED, 'equals', 1));
  
  
  //TODO: Check if this set is empty before creating a layer out of it.
  
  // Create a layer based off the currently selected paddocks
  var elevationOfSelectedPaddocks = ee.Image('CGIAR/SRTM90_V4');
  // var slope = ee.Terrain.slope(elevationOfSelectedPaddocks);
  

// // The region to reduce within.
// var poly = manager.app.paddock.geometry();

// // Reduce the image within the given region, using a reducer that
// // computes the max pixel value.  We also specify the spatial
// // resolution at which to perform the computation, in this case 200
// // meters.
// var max = elevationOfSelectedPaddocks.reduceRegion({
//   reducer: ee.Reducer.max(),
//   geometry: poly,
//   scale: 200
// });
  
  // manager.elevation = ui.Map.Layer({
  //     eeObject: elevationOfSelectedPaddocks, 
  //     // visParams: elevationVisParams, 
  //     name: LAYER_NAME_ELEVATION,
  //     shown: SHOWN_ELEVATION,
  // });
  
  vvar visParams = {bands: ['elevation'], min: 0, max: 200, palette: ['#1e7a00', '#66b100', '#dff100','#f1c90d',
      '#ffc623', '#ffa114','#ff5a0c']};
  
  manager.elevation = ui.Map.Layer(elevationOfSelectedPaddocks, visParams, "Elevation");
  
  manager.elevation.setOpacity(0.5);
  
  //https://developers.google.com/earth-engine/tutorial_api_03

//   var image = ee.Image('CGIAR/SRTM90_V4');

// // The region to reduce within.
// var poly = ee.Geometry.Rectangle([-109.05, 41, -102.05, 37]);

// // Reduce the image within the given region, using a reducer that
// // computes the max pixel value.  We also specify the spatial
// // resolution at which to perform the computation, in this case 200
// // meters.
// var max = image.reduceRegion({
//   reducer: ee.Reducer.max(),
//   geometry: poly,
//   scale: 200
// });

// // Print the result (a Dictionary) to the console.
// print(max);
  
  
//   var PointsSelected = [
//   ee.Feature(
//       ee.Geometry.Point([145.8960858217797, -17.56668979348206]),
//       {'name': 'point 1'}),
//   ee.Feature(
//       ee.Geometry.Point([145.89668123185277, -17.566176769199103]), 
//       {'name': 'point 2'}),
//   ee.Feature(
//       ee.Geometry.Point([145.89865533768773, -17.566054026681186]),
//       {'name': 'point 3'}),
//   ee.Feature(
//       ee.Geometry.Point([145.89865533768773, -17.566054026681186]),
//       {'name': 'point 4'}),
//   ee.Feature(
//       ee.Geometry.Point([145.89923234664957, -17.565685718404545]), 
//       {'name': 'point 5'})
// ];

// var PointsSelected = ee.FeatureCollection(PointsSelected);

// var elevationTestChart = ui.Chart.image.byRegion({
//   image: elevation,
//   regions: PointsSelected,
//   scale: 200,
//   xProperty: 'name'
// });

// elevationTestChart.setOptions({
//   title: 'Elevation test chart',
//   vAxis: {
//     title: 'Elevation (meters)'
//   },
//   legend: 'none',
//   lineWidth: 1,
//   pointSize: 4
// });

// print(elevationTestChart);

// elevation = elevation.setName("hansen1"); 
// elevation = elevation.setOpacity(0.5);

// layer 1 = layer 1.setName("hansen1"); 
// layer 1 = layer 1.setOpacity(0.5); 

// Map.addLayer(elevation, {min: 500, max: 4500});
// Map.addLayer(PointsSelected, {color: 'FF0000'});
// Map.setCenter(145.89865533768773, -17.565685718404545, 11);
  
  
};

  // below is added by li   not sure whether it is right 
  
  
//   var elevation = ee.Image('CGIAR/SRTM90_V4');

// var allPointsSelected = [
//   ee.Feature(
//       ee.Geometry.Point([145.8960858217797, -17.56668979348206]),
//       {'name': 'point 1'}),
//   ee.Feature(
//       ee.Geometry.Point([145.89668123185277, -17.566176769199103]), 
//       {'name': 'point 2'}),
//   ee.Feature(
//       ee.Geometry.Point([145.89865533768773, -17.566054026681186]),
//       {'name': 'point 3'}),
//   ee.Feature(
//       ee.Geometry.Point([145.89865533768773, -17.566054026681186]),
//       {'name': 'point 4'}),
//   ee.Feature(
//       ee.Geometry.Point([145.89923234664957, -17.565685718404545]), 
//       {'name': 'point 5'})
// ];

// var allPointsSelected = ee.FeatureCollection(allPointsSelected);


  // above Li




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
  
  
  //li
  Map.remove(manager.elevation); 
  
  Map.remove(manager.soil);
  
  // Create a new layer from the master list of paddocks
  setElevationLayer();
  
  setSoilLayer();
  
  setSelectedLayer();
  // Add the layer to the map.
  debug.info('Selected paddock outlines layer:', manager.selected);
  Map.add(manager.elevation); 
  
  Map.add(manager.soil);
  
  Map.add(manager.selected); 
  debug.info('Finished refreshing selected paddock outlines.');
};


// // by li, can delete 
// exports.refreshElevationOutlines = function() {
//   debug.info('Attempting to refresh elevation paddock outlines.');
//   // Remove the current layer of selected paddock outlines. 
//   // Doesn't matter if it hasn't been added to the map yet, so long as it is a Layer object.
//   Map.remove(manager.elevation); 
//   // Create a new layer from the master list of paddocks
//   setElevationLayer();
//   // Add the layer to the map.
//   debug.info('elevation paddock outlines layer:', manager.elevation);
//   Map.add(manager.elevation); 
//   debug.info('Finished refreshing elevation paddock outlines.');
// };