/**
 * @fileoverview This is the UI tool that displays detailed information
 * (NDVI charts etc.) for selected paddocks. Each selected paddock has its own
 * information panel on the paddock inspector.
 *
 */

// Manager
var manager = {};

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

/**
 * Initialises the paddock inspector UI widget.
 * Does not add the inspector to the root.ui here, since that is only
 * done when the first paddock is selected.
 */
exports.initialise = function(app) {
  debug.info('Initialising paddockInspector.');
  // Grab a reference to the app
  manager.app = app;
  // The paddock inspector UI widget
  manager.paddockInspector = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal'),
  });
  // Number of panels currently added to the Inspector UI.
  manager.numPanels = 0;
  // The list of panels currently added. Each element of this array is another list of
  // the form [paddock, infoPanel]
  manager.infoPanels = [];
};

/**
 * Renders this UI widget to the application's root UI
 * Called in the event that an information panel is added while no other information panels exist.
 */
var renderToApp = function() {
  // Add to ui root
  debug.info('Adding paddock inspector to root UI.');
  ui.root.insert(1, manager.paddockInspector);
};

/**
 * Removes this UI widget from the application's root UI
 * Called in the event that a paddock is selected while no other paddocks are currently selected.
 */
var removeFromApp = function() {
  // Remove from the ui root
  debug.info('Removing paddock inspector from root UI.');
  ui.root.remove(manager.paddockInspector);
};



/*
This stuff is currently BUGGED.
Will only work if things are removed in the same order they were opened.

*/











/**
 * Creates an info panel for the given paddock and adds it to the paddock inspector UI.
 * This is called whenever a paddock is selected.
 *
 * @param {ee.Feature} paddock - The paddock to add.
 */
exports.addPaddock = function(paddock) {
  debug.info('Adding the following paddock to the inspector UI:', paddock);
  // Create the info panel
  var infoPanel = manager.app.infoPanelFactory.createInfoPanel(paddock);
  // if already exits an info panel
  if (manager.numPanels === 1) {
    // get the right index of old info panel
    debug.info('attempting to remove old paddock', paddock);
    var oldPaddock = manager.infoPanels[0][0];
    debug.info('attempting to remove old paddock', oldPaddock);
    // remove old selected paddock with info panel
    manager.app.paddockManager.deselectPaddock(oldPaddock);
  }
  // Add the info panel and paddock to the dictionary
  manager.infoPanels[manager.numPanels] = [paddock, infoPanel];
  debug.info('infoPanels after addition of paddock:', manager.infoPanels);
  manager.numPanels++;
  // Add the info panel to the inspector UI
  manager.paddockInspector.add(infoPanel);

  // Check if this new paddock is the only selected paddock
  if (manager.numPanels === 1) {
    renderToApp();
  }
};

/**
 * Deletes the info panel for the given paddock from the inspector UI.
 * This is called whenever a paddock is deselected or the
 * 'close' button is pressed on the paddock's info panel.
 *
 * @param {ee.Feature} paddock - The paddock to remove.
 */
exports.removePaddock = function(paddock) {
  debug.info('Attempting to remove a paddock/infopanel from the paddock inspector:', paddock);
  manager.numPanels--;
  // Get the info panel
  var infoPanel = manager.infoPanels[manager.numPanels][1];
  // Remove the info panel and paddock from the dictionary
  manager.infoPanels[manager.numPanels] = 0;
  debug.info('infoPanels after deletion of paddock:', manager.infoPanels);
  // Remove the info panel to the inspector UI
  manager.paddockInspector.remove(infoPanel);

  // Check if this removed paddock was the only selected paddock
  if (manager.numPanels === 0) {
    removeFromApp();
  }
};
