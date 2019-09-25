/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var farmer = ee.FeatureCollection("projects/1622crop/regions");
/***** End of imports. If edited, may not auto-convert in the playground. *****/

// The base application object.
var app = {};

// Get now date
// var date = new Date();
// var nowYear = date.getFullYear();
// var nowMonth = date.getMonth()+1;
// var nowDate = date.getDate();
// var fullDate = nowYear + '-' + nowMonth + '-' + nowDate;

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

// Import all required scripts, including those required by imported scripts.
// ui widgets
app.draw = require('users/balddinosaur/sugarbyte:bin/ui_widgets/draw.js');
app.infoPanelFactory = require('users/balddinosaur/sugarbyte:bin/ui_widgets/information_panel_factory.js');
app.paddockInspector = require('users/balddinosaur/sugarbyte:bin/ui_widgets/paddock_inspector.js');
// paddock management
app.paddockOutliner = require('users/balddinosaur/sugarbyte:bin/paddock_outliner.js');
app.paddockManager = require('users/balddinosaur/sugarbyte:bin/paddock_manager.js');
// extras
app.cloudMasker = require('users/balddinosaur/sugarbyte:bin/cloud_masking.js');
app.smoother = require('users/balddinosaur/sugarbyte:bin/smooth_filter.js');
app.imageVisualiser = require('users/balddinosaur/sugarbyte:bin/image_visualiser.js');
app.mapClickHandler = require('users/balddinosaur/sugarbyte:bin/map_click_handler.js');
app.input = require('users/balddinosaur/sugarbyte:bin/ui_widgets/input.js');
//legend widget
app.legendWidget = require('users/balddinosaur/sugarbyte:bin/ui_widgets/legend_widget.js');
app.elevationLegendWidget = require('users/balddinosaur/sugarbyte:bin/ui_widgets/elevation_legend_widget.js');

/**
 * Adds global application constants as properties of the root app object.
 */
var createConstants = function() {
	// Selection property. Dictates whether or not a paddock is currently selected.
  app.PROPERTY_SELECTED = 'inspected';
  app.PROPERTY_TIME = 'system:time_start';
	
	// NDVI Visualisation parameters
	app.vis = {
		min: -0.1, max: 1, 
	//  palette: ['FFFFFF', 'CE7E45', 'FCD163', '66A000', '207401',
  //       '056201', '004C00', '023B01', '012E01', '011301']
    palette: ['red', 'CE7E45', 'FCD163', '66A000', '207401',
        '056201', '011301']
	};
	
	// elevation visualisation parameters
	app.elevation = {
		min: 0, max: 200, 
		palette: ['#1e7a00', '#66b100', '#dff100','#f1c90d','#ffc623','#ffa114','#ff5a0c']
    };
  
  // Defaults
  app.default = {
    CHART_START_DATE: '2018-01-01',
    // the default end date is current date
    CHART_END_DATE: new Date().toJSON().slice(0,10),
    MAP_ZOOM: 15,
    MAP_ZOOM_SELECTED: 16,
    mapCoordinates: {
      LON: 145.9222,
      LAT: -17.566
    },
    DATE_PLACEHOLDER: 'yyyy-mm-dd',
  };
};

/**
 * Adds global application variables as properties of the root app object.
 * These are variables that may be reassigned or altered by other app modules.
 * Altogether these variables should amount to the current application state.
 */
var createVariables = function() {
	// The complete list of paddocks. If the value of this is null at any point then it is considered empty.
	app.paddocks = null; // ee.FeatureCollection
	
	// The complete available set of satellite imagery data.
	app.dataset; // ee.ImageCollection
	
	// Boolean of whether or not the user is drawing a paddock on the map
	app.drawing = false;
};

/**
 * Generates and assigns a complete set of satellite imagery data to app.dataset.
 * This includes:
 *    - fetching the entire set of Sentinel2-1C data
 *    - filtering it by location to a smaller set (near checci paddocks)
 *    - masks clouds
 *    - adds an NDVI band
 *    - removes all bands except the NDVI band
 */
var generateDataset = function() {
  var SATELLITE_STRING_SENTINEL = 'COPERNICUS/S2';
  var band = {
    NIR: 'B8',
    RED: 'B4',
    NDVI: 'NDVI'
  };
	// Fetch and filter Sentinel2 dataset to a small area
	var point = ee.Geometry.Point(app.default.mapCoordinates.LON, app.default.mapCoordinates.LAT); // This is somewhere near cecchi paddocks
	app.dataset = ee.ImageCollection(SATELLITE_STRING_SENTINEL).filterBounds(point);
	// Mask clouds from dataset
	app.dataset = ee.ImageCollection(app.cloudMasker.maskCloudsScoring(
    app.dataset, app.cloudMasker.SATELLITE.SENTINEL, 1, 1, 1));
	// Calculate and add NDVI band
	app.dataset = app.dataset.map(function(image) {
				var ndvi = image.normalizedDifference([band.NIR, band.RED]).rename(band.NDVI);
				return image.addBands(ndvi).copyProperties(image, [app.PROPERTY_TIME]); // preserve the time property
	});
	// Remove all other bands that are no longer used.
	app.dataset = app.dataset.select(band.NDVI);
};

/**
 * Initialises or instantiates all internal modules utilised by the application.
 */
var initialiseInternalModules = function() {
	// Paddock manager
	app.paddockManager.initialise(app);
	
  //--------------------------------------------------------------------------------
  // Hardcoded to start with cecchi2016 paddocks pre-drawn. 
  // These need to be added before app.inputWidget is instantiated. Should be refactored later to not matter.
  app.paddockManager.addPaddocksWithoutUpdating(ee.FeatureCollection(farmer));
  //--------------------------------------------------------------------------------
  
	// Paddock outliner manager
	app.paddockOutliner.initialise(app);
	
	// Paddock inspector UI widget
	app.paddockInspector.initialise(app);
	
	// Paddock Inspector Informaion Panel factory
	app.infoPanelFactory.initialise(app);
	
	// Map click Handler
	app.mapClickHandler.initialise(app);
	
	// Image visualisation manager
	app.imageVisualiser.initialise(app);
	
	// Geometry input.js widget (for drawing new paddocks)
	debug.info('Initialising drawing widget.');
	app.drawingWidget = app.draw.create('Custom Geometry', app, true);
	
	// Image visualisation and paddock selection widget (panel along the top)
	debug.info('Initialising input.js widget.');
	app.input.initialise(app);
};

/**
 * Initialises map settings.
 */
var initialiseMapSettings = function() {
  Map.setControlVisibility({
    all: true,
    zoomControl: true,
    scaleControl: true,
    fullscreenControl: true
  });
	Map.style().set('cursor', 'crosshair');
	Map.setOptions('satellite');
	Map.onClick(app.mapClickHandler.handleClick);
	Map.setCenter(app.default.mapCoordinates.LON, app.default.mapCoordinates.LAT, app.default.MAP_ZOOM);
};

/**
 * Initialises the entire application. 
 * The order of functions executed here matters significantly.
 */
var initialiseApp = function() {
  createConstants();
  createVariables();
  generateDataset();
  initialiseInternalModules();
  initialiseMapSettings();
  // Refresh paddock outlines now that there are some paddocks.
	app.paddockOutliner.refreshOutlines();
};

initialiseApp();