/**
 * @fileoverview This file serves to initialise a ui.Panel object that containes the facilities to upload,
 * draw and manage geometry within the application. At this stage, Draw does not allow manual upload
 * of files, simply adding the imported 'geom' geometry object. Future development should investigate the Google
 * Picker API, allowing the user to select their own geometry from their own Google Drive.
 * When drawing, the user can select multiple points, and see a coloured outline drawn until points are connected or
 * the operation is cancelled. For each geometry object added, it can be removed.
 */

exports.doc = 'Constructs an interface that allows users to draw geometry on a Map.';

// Draw object of which all the following code modifies.
var Draw = {};

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

/**
 * This function instantiates all variables that are required before the Draw is setup.
 * Primarily, it creates an ee.List to store geometry, and JS arrays to store 'elements' and points.
 * Secondly, it defines constants that are used throughout the Draw, such as the default zoom level,
 * the distance before two points are classified as the same, and the colour of custom drawn geometry.
 */
Draw.createVariables = function() {

  // Default zoom level.
  Draw.ZOOM = 14;

  // Distance threshold to determine if geometry connected or not. Units are metres.
  Draw.THRESHOLD = 50;

  // Colour of the Draw.pointLayer outline.
  Draw.OUTLINE_COLOR = 'FFFFFF';

  // Prefix used to generate unique IDs and names for drawn geometry.
  Draw.prefixID = 'cg_';

  // Suffix used to generate unique IDs. Incremented as geometry is added.
  Draw.suffixID = 0;

  // Contains all points if drawing.
  Draw.pointList = [];
  Draw.pointLayer = ui.Map.Layer({
    visParams: {
      color: Draw.OUTLINE_COLOR
    },
    name: 'Points'
  });

};

/**
 * Instantiates all ui.Panels objects and a general layout of the Draw.
 * The parent container is created, and a dummy title label is added.
 * The following structure is observed:
 *
 * - 0 : Draw.titleLabel : This is updated with the string passed as Draw.title, otherwise defaults to 'Draw'.
 * - 1 : Draw.containerList : This ui.Panel contains all 'elements' of geometry as they are added.
 * - 2 : Draw.loadGeometryDraw : This ui.Panel contains all ui.Button objets that are used add geometry to the Map.
 */
Draw.createPanels = function() {

  // Parent container.
  Draw.container = ui.Panel({
    style: {position: 'top-right'},
    layout: ui.Panel.Layout.flow('vertical')
  });

  // Dummy label to store the title of the management panel.
  Draw.titleLabel = ui.Label('Draw');
  Draw.container.widgets().set(0, Draw.titleLabel);

  // Draw that contains the sub ui.Panels for each element.
  Draw.containerList = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical')
  });
  Draw.container.widgets().set(1, Draw.containerList);

  // Draw that contains options to upload or draw geometry.
  Draw.loadGeometryDraw = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal')
  });
  Draw.container.widgets().set(2, Draw.loadGeometryDraw);

  // add paddock select to the draw panel
  Draw.container.widgets().set(3, Draw.app.input.initialise(Draw.app));

};

/**
 * Creates all helper functions utilised by the Draw.
 */
Draw.createHelpers = function() {

  /**
   * Appends an element to the list of elements. An element has its associated geometry,
   * along with other properties.
   *
   * @param {string} title The title of the element. This is also the title of the layer.
   * @param {ee.Geometry} The geometry of the element.
   */
  Draw.appendElement = function(geometry) {
    debug.info('Attempting to append the following geometry:');
    debug.info(geometry);
    // The provided geometry must be cast to an ee.Feature.
    var paddock = ee.Feature(geometry);

    // Set the name and ID of the geometry to a combination of the pre-defined prefix and suffix of the ID.
    paddock = paddock.set('name', Draw.prefixID + Draw.suffixID, 'ID', Draw.prefixID + Draw.suffixID);

    // Create a ui.Textbox to update the name of the geometry when the value is changed.
    var textbox = ui.Textbox({
      placeholder: 'Loading...',
      onChange: function(textValue) {
        // Update the title if text is changed.
        paddock = paddock.set('name', textValue);
      }
    });

    // Create a ui.Button to remove the geometry from the collection of paddocks.
    var removeButton = ui.Button({
      label: 'Remove',
      onClick: function() {
        // Remove the panel from the Map.containerList widgets.
        Draw.containerList.widgets().remove(panel);

        // Remove the geometry from the app.
        Draw.removeGeometry(paddock);
      }
    });

    // Create a ui.Panel to contain the ui.Textbox and ui.Button.
    var panel = ui.Panel({
      widgets: [textbox, removeButton],
      layout: ui.Panel.Layout.flow('horizontal')
    });

    // Add the created ui.Panel to the Draw.containerList.
    Draw.containerList.add(panel);

    // Set the value of the textbox to the name of the geometry.
    debug.info('Attempting to evaluate the value of paddock:', paddock);
    paddock.get('name').evaluate(function(name) {
      textbox.setValue(name);
      debug.info('Sucessfully evaluated value of paddock as:', name);
    });


    // Increment the suffix counter in order to continue generating unique IDs.
    Draw.suffixID++;

    // Add the geometry to the paddock collection
    Draw.app.paddockManager.addPaddocks(paddock);
  };

  /**
   * Function to remove an element object from the application. Removes the associated layer,
   * Draw and element from the application.
   *
   * @parameter {Object} element Element to remove from the application.
   */
  Draw.removeGeometry = function(geometry) {
    // Use app.paddock_manager.removePaddock(paddock)

    /*
    // Use a filter to match and exclude all geometries of the same ID and redraw outlines.
    Draw.app.paddocks = Draw.app.paddocks.filter(ee.Filter.neq('ID', geometry.get('ID')));
    // depcrecated func Draw.app.refreshOutlines();
    Draw.app.inputWidget.updateList();
    */
  };

  /**
   * Adds a point to the Draw.pointList. If 2 or more points exist, it draws a layer containing
   * a line of all the points drawn thus far.
   *
   * @param {ee.Geometry.Point} point Represents the point clicked.
   */
  Draw.addPoint = function(point) {
    debug.info('Attempting to add a point while using drawer');
    // Add the clicked point to the list of points.
    Draw.pointList.push(point);

    // Check if 2 or more points have now been selected, if so add a red outline.
    if (Draw.pointList.length > 1) {
      Draw.pointLayer.setEeObject(ee.Geometry.LineString(Draw.pointList));

      // Add the Draw.pointLayer to the Map.
      if (!Map.layers().contains(Draw.pointLayer)) {
        Map.layers().set(Map.layers().length(), Draw.pointLayer);
      }
    }
  };

  /**
   * Cancels the drawing operation, resets the label of the Draw.drawButton and
   * re-initialises the Draw.pointList.
   */
  Draw.cancelDrawing = function() {
    debug.info('Attempting to cancel the drawing.')
    // Reset the ui.Button label text.
    Draw.drawButton.setLabel('Draw Geometry');

    // Clear the list of selected points.
    Draw.pointList = [];

    // Remove the Draw.pointLayer from the Map.
    Map.layers().remove(Draw.pointLayer);

    // Reset Draw.pointLayer to an empty ui.Map.Layer.
    Draw.pointLayer = ui.Map.Layer({
      visParams: {
        color: Draw.OUTLINE_COLOR
      },
      name: 'Points'
    });

    // Set the drawing flag to false.
    Draw.app.drawing = false;
  };

  /**
   * Callback function that conducts a check to see if the most recently selected point is
   * within proximity to close the geometry. It conducts 3 checks:
   * - Is the Draw.pointList empty?
   * - Does the Draw.pointList have enough points in it?
   * - Otherwise, check if points are contained within each other.
   *
   * @param {Object} point The coordinates that were selected on the Map.
   */
  exports.checkClosure = function(point) {
    point = ee.Geometry.Point(point.lon, point.lat);
    if (Draw.pointList.length > 2) {
      debug.info('Attempting to evaluate the value of (pointlist?).');
      point.distance(Draw.pointList[0]).evaluate(function(distance) {
        if (distance < Draw.THRESHOLD) {
          debug.info('Closure detected. Creating new paddock geometry.');
          Draw.appendElement(ee.Geometry.Polygon(Draw.pointList));
          Draw.cancelDrawing();
        } else {
          debug.info('No closure. adding a new point to the draw geometry.')
          Draw.addPoint(point);
        }
      });
    } else {
      Draw.addPoint(point);
    }
  };

  /**
   * Enables drawing mode, changes the Draw.drawButton label or cancels drawing mode if
   * already activated.
   */
  Draw.drawGeometry = function() {
    if (Draw.pointList.length === 0 && Draw.app.drawing === true) {
      Draw.cancelDrawing();
    } else if (Draw.pointList.length > 0) {
      Draw.cancelDrawing();
    } else {
      Draw.drawButton.setLabel('Cancel');
      Draw.app.drawing = true;
    }
  };

  /**
   * Creates a new export to an Earth Engine asset task, to export the ee.FeatureCollection containing all defined geometry.
   */
  Draw.createExportTask = function() {
    Export.table.toAsset(Draw.app.paddocks, 'Export_paddocks', 'paddocks');
  };

};

/**
 * Instantiates all ui.Button objects required for interacting with the Draw.
 */
Draw.createButtons = function() {

  // Draw button.
  Draw.drawButton = ui.Button({
    label: 'Draw Geometry',
    onClick: Draw.drawGeometry
  });
  Draw.loadGeometryDraw.add(Draw.drawButton);

  // Export button.
  Draw.exportButton = ui.Button({
    label: 'Export Paddocks',
    onClick: Draw.createExportTask
  });
  Draw.loadGeometryDraw.add(Draw.exportButton);

};

/**
 * Constructs the Draw.
 */
Draw.initialiseDraw = function(title) {

  // Assign the title of the Draw.
  Draw.title = title;
  Draw.titleLabel.setValue(Draw.title);

  // Setup the Map.
  Map.style().set('cursor', 'crosshair');

};

/**
 * Starts the Draw.
 *
 * @param {string} title Specify the title for the Draw.
 * @param {boolean} add Specify whether to add the Draw to the Map or not.
 *
 * @returns {ui.Panel} An object representing the UI component that is the Draw.
 *
 * @example var Draw = require('users/troymcdonald/crop1622:geometry_Draw');
 *          var test = Draw.create('Geometry Draw', true);
 */
exports.create = function(title, app, add) {

  // Instance of the application. Used to access variables within the application.
  Draw.app = app;

  // Run all setup functions.
  Draw.createVariables();
  Draw.createHelpers();
  Draw.createPanels();
  Draw.createButtons();
  Draw.initialiseDraw(title);

  // Add the Draw.
  if (add === true) {
    Map.add(Draw.container);
  }

  return Draw;

};
