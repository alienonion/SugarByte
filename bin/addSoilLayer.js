/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var imageCollection = ee.ImageCollection("CSIRO/SLGA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Load Landsat 5 data, filter by date and bounds.
var collection = ee.ImageCollection('CSIRO/SLGA')
  .filterDate('2000-01-01', '2013-05-01');

// Display the layer.
Map.addLayer(collection);