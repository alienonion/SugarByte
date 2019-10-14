/**
 * @fileoverview This is the UI tool that let user  slide date between a date range to compare NDVI images
 */

var manager = {};

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

exports.initialise = function(app) {
  manager.app = app;
  // current NDVI and elevation layers
  manager.currentLayers = {};
  manager.dateSliderContainer = null;
  manager.sliderLabel = ui.Label('Slide to show NDVI images for different dates', {margin: '0 0 -5px 0'});
};

var changeNDVIImage = function(range, paddock){

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
      manager.paddock.geometry(),
      // the layer name
      'NDVI layer for paddock: ' + manager.id,
      // clip the imagery to the paddock geometries
      true);
};

exports.createTimeline = function(startDate, endDate, initialDate, currentLayers, paddock) {
  // remove the layer select panel if already exists
  if (manager.dateSliderContainer !== null) {
    manager.dateSliderContainer.clear();
    Map.remove(manager.dateSlider);
  }

  // pass current layers to manager object
  manager.currentLayers = currentLayers;
  manager.paddock = paddock;

  manager.dateSliderContainer = ui.Panel({
    widgets: [manager.sliderLabel],
    layout: ui.Panel.Layout.flow('vertical'),
  })

  debug.info("creating date slider")
  manager.dateSlider = ui.DateSlider({
    start: startDate,
    end: endDate,
    value: initialDate,
    period: 5,
    onChange: changeNDVIImage,
    style: {
      minWidth: '500px',
      padding: '5px',
      whiteSpace: 'pre',
      fontSize: '15px'
    }
  });

  manager.dateSliderContainer.add(manager.dateSlider);
  debug.info("adding date slider widget to the map")
  Map.add(manager.dateSliderContainer);
};

exports.removeTimeline = function() {
  if (manager.dateSliderContainer !== null) {
    Map.remove(manager.dateSliderContainer);
  }
  Map.add(manager.dateSliderContainer);
}