/**
 * @fileoverview handler for when the user clicks on the map somewhere.
 */

var manager = {};

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

/**
 * Initialises the map click handler module.
 * @param {Object} app - The root application object.
 * @param {ee.FeatureCollection} app.paddocks -
 * @param {boolean} app.drawing -
 * @param {function} app.draw.js.checkClosure -
 */
exports.initialise = function(app) {
	debug.info('Initialising mapClickHandler');
  manager.app = app;
};

/**
 * Map click event handler.
 * Executed whenever the user clicks the map, provided the map is currently listening.
 * If the user is currently drawing a polygon, the event is handled by app.draw.js.checkClosuer().
 * Otherwise, if the point is within the bounds of a registered paddock, then that paddock is selected.
 * If multiple paddocks encompass the point, then one is selected arbitrarily.
 * @param {Object} clickEventInfo - All information passed by the map click event.
 */
exports.handleClick = function (clickEventInfo) {
  debug.info('The user clicked on the map:', clickEventInfo);
  // Check if the user is drawing
	if (manager.app.drawing === true) {
		manager.app.draw.checkClosure(clickEventInfo);
		return;
	}
	// Create a local list of the coords from the event info
	var localCoords = [clickEventInfo.lon, clickEventInfo.lat];
	// Save the coordinates to the server as an ee geometry object
	var point = ee.Geometry.Point(localCoords);
	// Check to see if click is in one of the declared paddocks
	var paddocksContaining = ee.FeatureCollection(
      manager.app.paddocks.filter(ee.Filter.bounds(point, ee.Number(1))));

	// callback function allows the size of the featurecollection to be retrieved asynchronously
	var checkPaddocksCallback = function(size) {
    // Check the size of the paddocks that contain the point
    // If 0 then clicked off the paddock and should go back to normal view
    if (size !== 0) {
      debug.info('Paddock Selected');
      // Flag the paddock as selected
      manager.app.paddockManager.selectPaddock(paddocksContaining.first());
    } else {
      debug.warning('No Paddock Selected. Do nothing');
    }
	};
	// Retrieve the size of the feature collection asynchronously
  paddocksContaining.size().evaluate(checkPaddocksCallback);
};