/**
 * @fileoverview This is the UI tool that displays NDVI legend for selected paddocks.
 */

var manager = {};

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

manager.createVariables = function(app) {
  manager.app = app;
  manager.legends = {};
};

manager.createUi = function() {

  /*
  create NDVI layer
   */
  var createNDVILegend = function() {
    // Master panel
    manager.legends.ndviLegend = ui.Panel({
      style: {
        position: 'bottom-center',
        padding: '8px 15px',
        shown: false
      },
      layout: ui.Panel.Layout.flow('horizontal'),
    });

    // Legend title
    var legendTitle = ui.Label({
      value: 'NDVI Legend',
      style: {
        fontWeight: 'bold',
        fontSize: '18px',
        margin: '0 0 4px 0',
        padding: '0'
      }
    });

    manager.legends.ndviLegend.add(legendTitle);
    // create the legend image
    var lon = ee.Image.pixelLonLat().select('longitude');
    var gradient = lon.multiply((manager.app.vis.max - manager.app.vis.min)/100.0).add(manager.app.vis.min);
    var legendImage = gradient.visualize(manager.app.vis);

    // Minimum value label
    manager.legends.ndviLegend.add(ui.Label(manager.app.vis.min));

    // Thumbnail for the image
    var thumbnail = ui.Thumbnail({
      image: legendImage,
      params: {bbox:'0,0,100,10', dimensions:'200x10'},
      style: {padding: '1px', position: 'bottom-center'}
    });

    manager.legends.ndviLegend.add(thumbnail);

    // Max value label
    manager.legends.ndviLegend.add(ui.Label(manager.app.vis.max));

    Map.add(manager.legends.ndviLegend);
  }

  /*
  create elevation layer
   */
  var createElevationLegend = function () {
    // Master panel
    manager.legends.elevationLegend = ui.Panel({
      style: {
        position: 'bottom-center',
        padding: '8px 15px',
        shown : false
      },
      layout: ui.Panel.Layout.flow('horizontal'),
    });

    // Legend title
    var legendTitle = ui.Label({
      value: 'Elevation Legend',
      style: {
        fontWeight: 'bold',
        fontSize: '18px',
        margin: '0 0 4px 0',
        padding: '0'
      }
    });
    manager.legends.elevationLegend.add(legendTitle);

    // create the legend image
    var lon = ee.Image.pixelLonLat().select('longitude');
    var gradient = lon.multiply((manager.app.elevation.max - manager.app.elevation.min)/100.0).add(manager.app.vis.min);
    var legendImage = gradient.visualize(manager.app.elevation);

    // Minimum value label
    manager.legends.elevationLegend.add(ui.Label(manager.app.elevation.min));

    // Thumbnail for the image
    var thumbnail = ui.Thumbnail({
      image: legendImage,
      params: {bbox:'0,0,100,10', dimensions:'200x10'},
      style: {padding: '1px', position: 'bottom-center'}
    });
    manager.legends.elevationLegend.add(thumbnail);

    // Max value label
    manager.legends.elevationLegend.add(ui.Label(manager.app.elevation.max));
    Map.add(manager.legends.elevationLegend);
  }

  createNDVILegend();
  createElevationLegend();
};

/**
 *
 */
exports.showNDVILayer = function() {
  hideAllLegends();
  manager.legends.ndviLegend.style().set('shown', true)
};

exports.showElevationLayer = function() {
  hideAllLegends();
  manager.legends.elevationLegend.style().set('shown', true)
};

/**
 * Initialises the NDVI legend widget.
 */
exports.initialise = function(app) {
  debug.info('Initialising legendWidget.');
  manager.createVariables(app);
  manager.createUi();
};

/**
 * Removes the NDVI legend widget if it already exists.
 */
var hideAllLegends = function() {
  // for loop all legends
  for (var element of manager.legends) {
    element.style().set("shown", false);
  }
};
exports.hideAllLegends = hideAllLegends;
