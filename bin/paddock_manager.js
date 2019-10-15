/**
 * @fileoverview This script module manages the master list of paddocks.
 */

var manager = {};

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

/**
 * Instantiate the paddock outline visualiser tool.
 * @param {Object} app - The root application object. This must be configured
 * @param {String} app.PROPERTY_SELECTED - The name of the property that flags a paddock as selected.
 * @param {ee.FeatureCollection} app.paddocks - The complete list of paddocks.
 * @param {function} app.input.js.updatePaddockSelector -
 *      Function to update the paddock list for the NDVI visualiser widget.
 */
exports.initialise = function(app) {
	debug.info('Initialising paddockManager.');
  // Save a reference to the app
  manager.app = app;
};

/**
 * Mappable function that adds necessary application properties given feature, then returns it.
 * Currently this only includes the selection property.
 * @param {ee.Feature} The feature to add the inspection state property to.
 * @return {ee.Feature} The feature with the inspection state property added.
 */
var addProperties = function(feature) {
  return feature.set(manager.app.PROPERTY_SELECTED, ee.Number(0));
};


/**
 * Adds one or more paddocks to the master list, ensuring each has the
 * necessary properties for the application to function.
 * @param {ee.Feature | ee.FeatureCollection} paddocks - The paddocks to add.
 */
var add = function(paddocks) {
  debug.info('Adding paddocks to master list:', paddocks);
  // Cast singular paddock Features to a FeatureCollection,
  // and add required app properties to each paddock.
  var newPaddocks = ee.FeatureCollection(paddocks).map(addProperties);

  // If the master paddock list is null, then reassign it to the new paddocks
  if (manager.app.paddocks === null) {
    manager.app.paddocks = newPaddocks;
  } else {
    manager.app.paddocks = ee.FeatureCollection(manager.app.paddocks).merge(newPaddocks);
  }
  debug.info('Updated master list of paddocks:', manager.app.paddocks);
};


/**
 * Adds one or more paddocks to the master list, ensuring each has the
 * necessary properties for the application to function.
 * This particular function is only used in the beginning, where modules require
 * an initial set of paddocks in order to be instantiated, but are updated by addPaddocks
 * meaning they need to be declared before the initial set of paddocks are added.
 * @param {ee.Feature | ee.FeatureCollection} paddocks - The paddocks to add.
 */
exports.addPaddocksWithoutUpdating = function(paddocks) {
  add(paddocks);
};

/**
 * Adds one or more paddocks to the master list, ensuring each has the
 * necessary properties for the application to function.
 * Then proceeds to update all application modules that are interested in the
 *    event of another paddock being added.
 * @param {ee.Feature | ee.FeatureCollection} paddocks - The paddocks to add.
 */
exports.addPaddocks = function(paddocks) {
  add(paddocks);
  // Update the list of paddocks available to the NDVI visualiser widget
  manager.app.input.updatePaddockSelector();
  // Refresh paddock outlines
  manager.app.paddockOutliner.refreshOutlines();
};

/**
 *
 *
 */
exports.removePaddock = function() {
  // TODO: implement this
  // When this is implemented, consider setting the list to null if it is empty (otherwise need to change addPaddocks empty check)
};




/**
 * Flags a paddock as selected, then refreshes all selected paddock outlines.
 * @param {ee.Feature} paddock - The paddock to select.
 */
exports.selectPaddock = function(paddock) {
  debug.info('Attempting to select the following paddock:', paddock);
  // Focus the map on the paddock
  Map.centerObject(paddock, manager.app.default.MAP_ZOOM_SELECTED);

  /* Unfortunately it's quite awkward to edit the metadata of a single feature
    in a FeatureCollection. The collection needs to be filtered to remove the feature,
    then have the feature re-added to the collection with the altered metadata.
  */
  // Flag the paddock as selected
  var selectedPaddock = paddock.set(manager.app.PROPERTY_SELECTED, 1);
  debug.info('SelectedPaddock (after setting property value to 1):', selectedPaddock);
  // Filter out the selected paddock from the master paddock list using its ID,
  // then merge the new paddock with the filtered list
  var paddockID = paddock.get('ID');
  debug.info('paddockID:', paddockID);
  var updatedList = ee.FeatureCollection(manager.app.paddocks)
      .filterMetadata('ID', 'not_equals', paddockID)
      .merge(ee.FeatureCollection([selectedPaddock]));
  debug.info('updatedList:', updatedList);
  // Update the master paddock list
  manager.app.paddocks = updatedList;

  // Update parts of the application that care about the currently selected paddocks
  // Refresh selected paddock outlines
  manager.app.paddockOutliner.refreshSelectedOutlines();
  // Tell the paddock inspector UI to add a new paddock
  manager.app.paddockInspector.addPaddock(selectedPaddock);

  // Done
  debug.info('Finished execution of events from selecting a paddock.');
};

/**
 * Unflags a paddock as selected, then refreshes all paddock outlines.
 * @param {ee.Feature} paddock - The paddock to deselect.
 */
exports.deselectPaddock = function(paddock) {
  debug.info('Attempting to deselect the following paddock:', paddock);
  // Unflag the paddock as selected
  var deselectedPaddock = paddock.set(manager.app.PROPERTY_SELECTED, ee.Number(0));

  // Filter out the selected paddock from the master paddock list using its ID,
  // then merge the new paddock with the filtered list
  var paddockID = paddock.get('ID');
  var updatedList = ee.FeatureCollection(manager.app.paddocks)
      .filterMetadata('ID', 'not_equals', paddockID)
      .merge(ee.FeatureCollection([deselectedPaddock]));
  // Update the master paddock list
  manager.app.paddocks = updatedList;

  // remove this panel's NDVI layer after close
  manager.app.imageVisualiser.clearAllNdviLayers();
  // remove elevation and soil layers after close
  manager.app.imageVisualiser.clearEleSoilLayers();
  debug.info("removing legends while closing info panel");
  // remove legends while closing info panel
  manager.app.legendWidget.hideAllLegends();
  // remove timeline widget
  manager.app.timeline.removeTimeline();

  // Refresh selected paddock outlines
  manager.app.paddockOutliner.refreshSelectedOutlines();
  // Tell the paddock inspector UI to remove the deselected paddock
  manager.app.paddockInspector.removePaddock(paddock);

  // Done
  debug.info('Finished execution of events from deselecting a paddock.');
};
