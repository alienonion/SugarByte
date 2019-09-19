/**
 * @fileoverview This is a factory that receives a paddock,
 * then creates and returns an Information Panel for that paddock.
 * The contents of the information panel include NDVI chart visualisations
 * and visualisation tools, and possible comments or annotations on the paddock.
 *
 */

// Manager
// Only used to grab global app access. Management of each individual
// information panel is performed by paddock_inspector.js.js
var manager = {};

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

/**
 * Initialises the information panel factory.
 */
exports.initialise = function(app) {
  debug.info('Initialising informationPanelFactory.');
  // Grab a reference to the app
  manager.app = app;// create a label to prompt users that points on map can be clicked to show the NDVI for that day on the map
  
};

/**
* to create the layer select panel.
*/
var createSelectWidget = function (paddock) {
  
  manager.timeLabel  = ui.Label({
    value: 'Click a point on the chart to show the NDVI for that date.',
    style: {
      position: 'top-center',
      height: '30px',
    }
  });
  debug.info("created time label");

  var selectTitle  = ui.Label({
      value: 'Please select the layer to show',
      style: {
          position: 'top-center',
          height: '30px',
          backgroundColor:'#dcf0e4',
          fontWeight: 'bold',
          fontFamily: 'Comic Sans MS',
      }
  });
  debug.info('Created selectTitle label');
  // Layer selection
  // keys
  var keys = {
      Soil: 'select NDVI layer',
      Evelation: 'select evelation layer'
  };
  // Select
  var selectBox = ui.Select({
      items: Object.keys(keys),
      //onChange: function(key) {
      // change layer
      //}
  });
  manager.layerSelectPanel = ui.Panel({
    widgets: [manager.timeLabel, selectTitle, selectBox],
    layout: ui.Panel.Layout.flow('vertical'),
    style: {
      width: '250px',
      position: 'middle-left',
    }
  });
  
  Map.add(manager.layerSelectPanel);
  debug.info("added layer select panel")
};

/**
 * Creates an information panel heading for the given paddock.
 * Includes a title with the paddock's ID and the close button, among other things.
 *
 * @return {ui.Panel} - A panel containing all the widgets for the info panel heading.
 */
var createHeading = function(paddock) {
  debug.info('Creating heading widget panel for an information panel.');
  // Title
  var title = "Paddock: ";
  var titleLabel = ui.Label({
    value: title,
    style: {
      fontWeight: 'bold',
      fontSize: '20px',
      fontFamily: 'Comic Sans MS',
      backgroundColor: '#dcf0e4',
      padding: '5px',
      margin: '10px 5px',

    }
  });

  // Description
  var description = "Detailed information for Paddock: ";
  var descriptionLabel = ui.Label(description);

  // Asynchronous retrieval of paddock ID. Resets the contents of the
  // title and description labels to include the ID.
  var getPaddockId = function(id) {
    debug.info('Paddock ID:', id);
    manager.id = id;
    title += id;
    description += id;
    titleLabel.setValue(title);
    descriptionLabel.setValue(description);
  };
  paddock.get('ID').evaluate(getPaddockId);

  // Close button
  /**
   * The function to run when the close button onClick event is triggered.
   * @param {ui.Button} button - The button that executed this onClick function.
   */
  var closeEvent = function(button) {
    // deselect paddock and close current info panel
    manager.app.paddockManager.deselectPaddock(paddock);
    //remove layer select panel
    Map.remove(manager.layerSelectPanel);
    debug.info("layer select panel removed");
    // remove this panel's NDVI layer after closing
    manager.app.imageVisualiser.clearAllNdviLayers();
  };

  var closeButton = ui.Button('Close', closeEvent, false, {});

  // Create panel to encompass these widgets and return it
  var headingPanel = ui.Panel({
    widgets: [
      titleLabel,
      descriptionLabel,
      closeButton
    ],
  });
  return headingPanel;
};

/**
 * Creates an ndvi chart visualiser for the given paddock.
 * Its most basic form is a Mean NDVI-vs-Time scatter plot with date selection options.
 *
 * @param {ee.Feature} paddock - The paddock to create an info panel NDVI chart visualiser for.
 * @return {ui.Panel} - A panel containing all the widgets involved with the NDVI chart visualiser.
 */
var createNDVIVisualiser = function(paddock) {
  debug.info('Creating NDVI Visualiser widget panel for an information panel.');
  // Date selection widgets
  // Textual input for starting date to visualise from
  var startDateBox = ui.Textbox({
    placeholder: manager.app.default.DATE_PLACEHOLDER,
    value: manager.app.default.CHART_START_DATE,
  });
  // Textual input for end date to visualise to
  var endDateBox = ui.Textbox({
    placeholder: manager.app.default.DATE_PLACEHOLDER,
    value: manager.app.default.CHART_END_DATE,
  });
  // Encapsulate the date text boxes in a panel that includes a horizontally positioned label
  var startDatePanel = ui.Panel([ui.Label('Start date'), startDateBox], ui.Panel.Layout.flow('horizontal'));
  var endDatePanel = ui.Panel([ui.Label('End date'), endDateBox], ui.Panel.Layout.flow('horizontal'));

  // NDVI chart container. Each time a new graph is created,
  // this panel is cleared and the new chart is added.
  var CHART_POSITION_INDEX = 3;
  var chartContainer = ui.Panel({
    style: {
      width: '400px',
      height: '400px',
    },
  });



  /**
   * The function to run when the visualise button's onClick event is triggered.
   * Updates the graph to use the new dates in the start/end date textboxes
   * @param {ui.Button} button - The button that executed this onClick function.
   */
  var visualise = function(button) {
    debug.info('Visualise: Updating Charts.');
    // Filter to relevant data
    debug.info('Paddock:', paddock);
    var localPaddock = paddock.getInfo();
    debug.info('localPaddock:', localPaddock);
    debug.info('geometry:', localPaddock.geometry);
    var filtered = ee.ImageCollection(manager.app.dataset
        .filterBounds(localPaddock.geometry)
        .filterDate(startDateBox.getValue(), endDateBox.getValue()));
    debug.info('filtered:', filtered);

    // Generate Chart
    debug.info('Generating NDVI chart:', paddock);
    var ndviChart = ui.Chart.image.series(filtered, ee.Geometry(localPaddock.geometry), ee.Reducer.mean(), 500);

    ndviChart.setOptions({
      title: 'NDVI Over Time',
      vAxis: {
        title: 'NDVI',
      },
      hAxis: {
        title: 'date',
        format: 'MM-yy',
        gridlines: {
          count: 7
        }
      },
      pointSize: 0.6,
      //lineSize: 0.3, // We don't want lines on the 'raw' scatter plot due to inconsistent data coverage
    });
    debug.info('Created NDVI chart for paddock. Setting it to be a scatter chart.');
    ndviChart.setChartType('ScatterChart');

    // Clear the chart container panel and add the new chart
    chartContainer.clear().add(ndviChart);

    // When the chart is clicked, update the map and label.
    ndviChart.onClick(function(xValue, yValue, seriesName) {
      if (!xValue) return;  // Selection was cleared.

      // Show the image for the clicked date.
      var date = ee.Date(new Date(xValue));
      debug.info("clicked data is", date);

      // Get the 5 day range (guarantees that at least one data point will be present
      // var dateRange = ee.DateRange(date, date.advance(5, 'day'));

      // // clear all NDVI layers before displaying new one
      // manager.app.imageVisualiser.clearAllNdviLayers();

      //visualizing NDVI of chosen time point of scatter chart on the map,
      // then assign returned layer to manager.currentLayer
      manager.currenttLayer = manager.app.imageVisualiser.displayPaddockNDVIOnDate(

          //the clicked date on the scatter chart
          date,
          // the paddock chosen by user
          paddock.geometry(),
          // the layer name
          'NDVI layer for paddock: '+ manager.id,
          true);

      // Show a label with the date on the map.
      manager.timeLabel.setValue(new Date(xValue).toUTCString());
      debug.info("display NDVI imagery for paddock:", paddock.getString("ID"));
    });
    debug.info("added NDVI imagery to time series", date);
  };
    ////////////////////////////
  // Visualise button
  var visualiseButton = ui.Button({
    label: 'Visualise',
    onClick: visualise,
  });
  
  // Layer selection
  // keys
  var keys = {
    Soil: 'select soil layer',
    Evelation: 'select evelation layer'
  };
  // Select
  var selectBox = ui.Select({
    items: Object.keys(keys),
    //onChange: function(key) {
      // change layer
    //}
  });
  



  // Create panel to encompass these widgets and return it
  var visualiserPanel = ui.Panel({
    widgets: [
      startDatePanel,
      endDatePanel,
      visualiseButton,
      chartContainer,
      selectBox
    ],
  });
  return visualiserPanel;
};

/**
 * Creates an season comparator for the given paddock.
 * Includes a method of defining seasons (i.e. date ranges) to visualise,
 * then normalises the date ranges and plots ndvi vs. time series for those seasons.
 *
 * @param {ee.Feature} paddock - The paddock to create a season comparator for.
 * @return {ui.Panel} - A panel containing all the widgets involved with the season comparator.
 */
var createSeasonComparator = function(paddock) {
  debug.info('Creating season comparator widget panel for an information panel.');
  var growingSeasons = [];

  // Title label for growing season comparison
  debug.info('Creating title label for growing season comparison.')
  var titleLabel = ui.Label({
    value: 'Growing Season Comparison',
    style: {
      fontWeight: 'bold',
      fontSize: '24px',
      margin: '10px 5px',
    }
  });

  // Heading label for season adding
  debug.info('Creating \'Add Season\' heading for growing season comparison.');
  var addSeasonLabel = ui.Label('Add New Season');

  // Widgets for creating a new season
  debug.info('Creating seasonStartBox.');
  var seasonStartBox = ui.Textbox({
    placeholder: 'Plant: ' + manager.app.default.DATE_PLACEHOLDER,
  });
  debug.info('Creating seasonEndBox.');
  var seasonEndBox = ui.Textbox({
    placeholder: 'Harvest: ' + manager.app.default.DATE_PLACEHOLDER,
  });

  // Panel that shows all currently added seasons
  debug.info('Creating growingSeasonPanel.');
  var growingSeasonPanel = ui.Panel();

  var addGrowingSeason = function() {
    debug.info('Executing addGrowingSeason.');
    // The start and end dates for the growing season
    var seasonStartDate = seasonStartBox.getValue();
    var seasonEndDate = seasonEndBox.getValue();
    growingSeasons.push([seasonStartDate, seasonEndDate]);

    // The label showing the season date range
    var seasonLabel = ui.Label(seasonStartDate + " -> " + seasonEndDate);

    // The panel for the growing season being added.
    var seasonPanel = ui.Panel({
      widgets: [seasonLabel],
      layout: ui.Panel.Layout.flow('horizontal'),
    });

    /**
     * Function to remove this growing season.
     * Called when the removeButton is clicked.
     * @param {ui.Button} button - The button that called this function.
     */
    var removeGrowingSeason = function(button) {
      debug.info('Executing removeGrowingSeason.');
      // Using a closure to save the plant and panel that it is deleting
      growingSeasons = growingSeasons.filter(function(season) {
        return season[0] !== seasonStartDate && season[1] !== seasonEndDate;
      });
      growingSeasonPanel.remove(seasonPanel);
    };

    // The button for removing the season from the growing season panel
    var removeButton = ui.Button({
      label: 'Remove',
      onClick: removeGrowingSeason,
    });

    // Add the remove button to the season panel
    seasonPanel.add(removeButton);

    // Add the season panel to the panel of all growing seasons
    growingSeasonPanel.add(seasonPanel);
  };

  debug.info('Creating seasonAddButton.');
  var seasonAddButton = ui.Button({
    label: 'Add Season',
    onClick: addGrowingSeason,
  });
  // Panel that encompasses widgets for creating a new season
  debug.info('Creating newSeasonPanel.');
  var newSeasonPanel = ui.Panel([seasonStartBox, seasonEndBox, seasonAddButton], ui.Panel.Layout.flow('horizontal'));

  // The seasonal comparison chart container
  debug.info('Creating chartContainer.');
  var chartContainer = ui.Panel({
    style: {
      width: '400px',
      height: '400px',
    },
  });

  var refreshComparisonChart = function() {
    debug.info('Executing refreshComparisonChart.');
    if(growingSeasons.length < 1) {
      return;
    }

    var paddockGeometry = ee.Feature(paddock).getInfo().geometry;
    var data = ee.ImageCollection(manager.app.dataset.filterBounds(paddockGeometry));
    debug.info('Data initial:', data);

    var total = null;
    debug.info('Doing something to growingSeasons:', growingSeasons);
    growingSeasons.map(function(s) {
      var d = ee.ImageCollection(data.filterDate(s[0], s[1]));
      debug.info('d:', d);
      var splitDate = s[0].split("-");
      var months = parseInt(splitDate[1], 10) - 1;
      var days = parseInt(splitDate[2], 10) - 1;

      debug.info('Normalising the dates.');
      // Normalise the dates
      d = ee.ImageCollection(d).map(function(i) {
        var image = ee.Image(i); // cast to image to avoid problems
        var time = image.get(manager.app.PROPERTY_TIME);
        time = ee.Date(time).advance(-months, 'month');
        time = time.advance(-days, 'day');
        return image.set(manager.app.PROPERTY_TIME, time);
      });

      debug.info('Checking if total is null.');
      if (total === null) {
        total = d;
      } else {
        total = total.merge(d);
      }

      debug.info('Finished growingseasons map over one of the seasons.');
      return null;
    });

    //total = manager.app.smoother.filterExtremes(total, 0.07);

    // Generate chart
    debug.info('Creating the comparison chart itself.');
    var compareChart = ui.Chart.image.doySeriesByYear(total, 'NDVI', ee.Geometry(paddockGeometry), ee.Reducer.mean(), 500);
    compareChart.setOptions({
      title: 'Growing Season Comparison',
      vAxis: {title: 'NDVI'},
      hAxis: {title: 'Days Since Planting', format: '', gridlines: {count:12}},
      pointSize: 0.6,
      lineSize: 0.3,
    }).setChartType('ScatterChart');

    chartContainer.clear().add(compareChart);
    debug.info('Finished executing refreshComparisonCharts().');
  };

  // Button to (re)create seasonal comparison chart using the currently added seasons
  var compareButton = ui.Button({
      label: 'Create/Update Comparison Chart',
      onClick: refreshComparisonChart,
  })

  // Create and return the season comparator panel
  var seasonComparatorPanel = ui.Panel({
    widgets: [
      titleLabel,
      addSeasonLabel,
      newSeasonPanel,
      growingSeasonPanel,
      compareButton,
      chartContainer
    ],
  });
  return seasonComparatorPanel;
};

/**
 * Creates and returns an info panel. DOES NOT render it anywhere.
 *
 * Note that the UI panel returned contains events that may alter the state
 * of the application. More specifically, the 'close' event will fire
 * app.paddockManager.deselectPaddock functions.
 * @param {ee.Feature} paddock - The paddock to generate an info panel for.
 * @return {ui.Panel} - The UI information panel object.
 */
exports.createInfoPanel = function(paddock) {
  debug.info('Creating an info panel for the paddock:', paddock);
  // Create and add a heading for the info panel
  var headingWidget = createHeading(paddock);
  
  createSelectWidget(paddock);

  // ndvi chart visualiser
  var visualiserWidget = createNDVIVisualiser(paddock);

  // Season comparisons
  var seasonComparatorWidget = createSeasonComparator(paddock);

  // Create and return the info panel
  var infoPanel = ui.Panel({
    widgets: [
      headingWidget,
      visualiserWidget,
      seasonComparatorWidget],
    style: {width: '500px'},
  });
  return infoPanel;
};


// Normally clicking 'visualise' would do this, to update map with ndvi imagery.
// Removed in order to speed up prototype testing, can be added back if thought to be useful
/*
    // Then output that range onto the base map
    manager.app.refreshBaseMap(manager.startDate.getValue(), manager.endDate.getValue(), null);
*/
