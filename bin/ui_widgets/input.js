var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');


// Manager
var manager = {};

/**
 * Handle selection of an option from the paddock selector
 * Centers the map on that paddock, adds the detailed information panel to Paddock Inspector
 *
 * @param {String} paddockID - The paddock ID selected from the drop-down menu.
 */
var handleSelection = function(paddockID) {
  debug.info('handling paddock selection for paddockID:');
  debug.info(paddockID);
  // Find the selected paddock using its ID
  var selectedPaddock = manager.app.paddocks.filterMetadata('ID', 'equals', paddockID).first();
  // Select the paddock normally
  manager.app.paddockManager.selectPaddock(selectedPaddock);
};

/**
 * Function for asynchronous retrieval of paddock IDs from a feature collection, then
 * creates a select widget from them and sets it as the contents of manager.paddockSelectorContainer.
 *
 * @param {ui.FeatureCollection} regions - The feature collection to create the paddock selector widget for.
 */
var createPaddockSelector = function(regions) {
  var options = regions['features'].map(function(f) {
    return f.properties.ID;
  });
  // Updates the Paddock ui.Select widget
  // ui.Select widgets do not support retroactively updating their item list,
  // so an entirely new widget needs to be created
  var paddockSelect = ui.Select({
    items: options,
    onChange: handleSelection,
    disabled: false // Now that we have the paddock IDs loaded, we can enable the widget
  });
  // Clear the container and add the new widget
  manager.paddockSelectorContainer.clear().add(paddockSelect);
};

/**
 * Create The main widget panel for user input of paddock IDs and imagery visualisation.
 *
 * @return {ui.Panel} The widget panel created, with its other widgets added to it.
 */
var createUI = function() {
  var masterStyle = {
    position: 'top-center'
  };

  // The main panel to add other widgets to
  var mainPanel = ui.Panel({
    style: masterStyle,
    layout: ui.Panel.Layout.flow('vertical'),
  });

  // Paddock Selection label
  var paddockSelectLabel = ui.Label('Select paddock to explore', {fontWeight : 'bold'});
  mainPanel.widgets().set(0, paddockSelectLabel);

  // Paddock selector container that gets updated whenever createPaddockSelector is called.
  mainPanel.widgets().set(1, manager.paddockSelectorContainer);
  // Retrieve the feature collection of paddocks asynchronously
  manager.app.paddocks.evaluate(createPaddockSelector);
  // // Date select label
  // var dateSelectLabel = ui.Label('View a Date (Will Display a median image of the surrounding 5 days)');
  // mainPanel.widgets().set(2, dateSelectLabel);
  //
  // // Date select text box
  // var dateInput = ui.Textbox({
  //   placeholder: 'yyyy-mm-dd',
  // });
  // mainPanel.widgets().set(3, dateInput);

  /**
   * Respond to user specifying a date to visualise
   * Called by dateSelectButton
   *
   * @param {ui.Button} button - The button that triggered the event.
   */
  // var viewDate = function(button) {
  //   // Get date from the text box
  //   var date = ee.Date.parse('YYYY-MM-dd', dateInput.getValue());
  //   // Get the 5 day range (guarantees that at least one data point will be present
  //   var dateRange = ee.DateRange(date, date.advance(5, 'day'));
  //   // Clear other imagery layers
  //   manager.app.imageVisualiser.clearAllNdviLayers();
  //   // Create and display the imagery, holding on to a copy of the layer
  //
  //   manager.app.imageVisualiser.displayPaddockNDVIMedian(
  //       dateRange.start(),
  //       dateRange.end(),
  //       manager.app.paddocks,
  //       'Paddock NDVI median',
  //       true);
  // };
  // // Date select button
  // var dateSelectButton = ui.Button('View Date', viewDate, false, {});
  // mainPanel.widgets().set(4, dateSelectButton);

  return mainPanel;
};

exports.initialise = function(app) {
  // Save the parent app
  manager.app = app;
  // Paddock Selection menu container.
  // The contents of this start empty, but are asynchronously updated via createPaddockSelector()
  // Must be a property of manager to allow exports.updatePaddockSelector() to also access the container.
  manager.paddockSelectorContainer = ui.Panel();
  // Create the UI and return it
  return createUI();

  // Map.add(mainPanel);
};

/**
 * Allows other application modules to trigger the paddock selector to update.
 * Called by paddockManager.addPaddocks();
 */
exports.updatePaddockSelector = function() {
  manager.app.paddocks.evaluate(createPaddockSelector);
}
