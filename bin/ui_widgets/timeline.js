/**
 * @fileoverview This is the UI tool that let user  slide date between a date range to compare NDVI images
 */

var manager = {};

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

exports.initialise = function(app) {
  manager.app = app;
  // current NDVI and elevation layers
  manager.currentLayers = {};
  manager.dateSlider = null;
};

var changeNDVIImage = function(range){

  debug.info("changing NDVI image to slide date");
  // clear all NDVI and elevation layers before displaying new one
  manager.app.imageVisualiser.clearAllNdviLayers();

  // get the start date
  var date = range.start();
  // Get the 5 day range (guarantees that at least one data point will be present
  var dateRange = ee.DateRange(date, date.advance(5, 'day'));

  // visualizing NDVI of chosen time point of scatter chart on the map,
  // then assign returned layer to Object manager.currentLayers
  manager.currentLayers.NDVI = manager.app.imageVisualiser.displayPaddockNDVIMedian(
      //the clicked date on the scatter chart
      dateRange.start(),
      dateRange.end(),
      // the paddock chosen by user
      paddock.geometry(),
      // the layer name
      'NDVI layer for paddock: ' + manager.id,
      // clip the imagery to the paddock geometries
      true);
};

exports.createTimeline = function(startDate, endDate, dateRange, currentLayers) {
  // remove the layer select panel if already exists
  if (manager.dateSlider !== null) {
    Map.remove(manager.dateSlider);
  }

  // pass current layers to manager object
  manager.currentLayers = currentLayers

  debug.info("creating date slider")
  manager.dateSlider = ui.DateSlider({
    start: startDate,
    end: endDate,
    value: dateRange.start(),
    period: 5,
    onChange: changeNDVIImage,
    style: {
      minWidth: '500px',
      padding: '5px',
      whiteSpace: 'pre',
      fontSize: '15px'
    }
  });

  debug.info("adding date slider widget to the map")
  Map.add(manager.dateSlider);
};

exports.removeTimeline = function() {
  if (manager.dateSlider !== null) {
    Map.remove(manager.dateSlider);
  }
  Map.add(manager.dateSlider);
}