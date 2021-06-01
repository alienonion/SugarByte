/**
 * @fileoverview This is the UI tool that let user slide date between a date range to compare NDVI images
 */

var manager = {};

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

exports.initialise = function(app) {
  manager.app = app;
  // current NDVI and elevation layers
  manager.currentLayers = {};
  manager.dateSliderContainer = null;
  manager.sliderLabel = ui.Label('Slide to show NDVI images for different dates', {fontWeight: 'bold', margin: '0 0 -5px 15px'});
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
      manager.paddock.geometry(),
      // the layer name
      'NDVI layer',
      // clip the imagery to the paddock geometries
      true);

  // set layer select value to NDVI
  manager.app.layerSelectWidget.setSelectValue();
};

exports.createTimeline = function(startDate, endDate, initialDate, currentLayers, paddock) {
  debug.info("creating time line");
  // remove the layer select panel if already exists
  if (Map.widgets().indexOf(manager.dateSliderContainer) !== -1) {
    manager.dateSliderContainer.clear();
    Map.remove(manager.dateSliderContainer);
  }

  // pass current layers to manager object
  manager.currentLayers = currentLayers;
  manager.paddock = paddock;

  manager.dateSliderContainer = ui.Panel({
    style: {
      margin: '40x 0',
    },
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
      maxWidth: '500px',
      width:'450px',
      whiteSpace: 'pre',
      fontSize: '12px'
    }
  });

  manager.dateSliderContainer.add(manager.dateSlider);
  debug.info("adding date slider widget to the map")
  Map.add(manager.dateSliderContainer);
};

exports.removeTimeline = function() {
  debug.info("removing existing timeline from map");
  // remove existing time line from map
  if (Map.widgets().indexOf(manager.dateSliderContainer) !== -1) {
    manager.dateSliderContainer.remove(manager.sliderLabel);
    Map.remove(manager.dateSliderContainer);
  }
  manager.dateSliderContainer = null;
}
