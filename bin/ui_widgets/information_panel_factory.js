/**
 * @fileoverview This is a factory that receives a paddock,
 * then creates and returns an Information Panel for that paddock.
 * The contents of the information panel include NDVI chart visualisations
 * and visualisation tools, and possible comments or annotations on the paddock.
 *
 */

// Manager only used to grab global app access. Management of each individual
// information panel is performed by paddock_inspector.js.js
var manager = {};

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');


/**
 * Initialises the information panel factory.
 */
exports.initialise = function (app) {
  debug.info('Initialising informationPanelFactory.');
  // Grab a reference to the app
  manager.app = app;
  // current NDVI and elevation layers
  manager.currentLayers = {};
};


/**
 * Creates an information panel heading for the given paddock.
 * Includes a title with the paddock's ID and the close button, among other things.
 *
 * @return {ui.Panel} - A panel containing all the widgets for the info panel heading.
 */
var createHeading = function (paddock) {
  debug.info('Creating heading widget panel for an information panel.');
  // Title
  var title = "Paddock Explorer";
  var titleLabel = ui.Label({
    value: title,
    style: {
      fontWeight: 'bold',
      fontSize: '24px',
      margin: '10px 5px',
    }
  });

  // Description
  var descriptionLabel = ui.Label({
    value : "The NDVI visualiser for Paddock: ",
    style: {stretch: 'vertical', fontSize : '14px'}
  });

  var loadingLabel = ui.Label({
    value: 'Loading...',
    style: {stretch: 'vertical', fontSize : '14px', color: 'gray'}
  });
  var descriptionContainer = ui.Panel({
      widgets : [descriptionLabel, loadingLabel],
      layout : ui.Panel.Layout.flow('horizontal')});

  // Asynchronous retrieval of paddock ID. Resets the contents of the
  // title and description labels to include the ID.
  var getPaddockId = function (id) {
    debug.info('Paddock ID:', id);
    manager.id = id;
    title += id;
    // hide loading label
    loadingLabel.style().set({color: 'black'});
    // titleLabel.setValue(title)
    loadingLabel.setValue(id);
  };
  paddock.get('ID').evaluate(getPaddockId);

  // Close button
  /**
   * The function to run when the close button onClick event is triggered.
   * @param {ui.Button} button - The button that executed this onClick function.
   */
  var closeEvent = function (button) {
    // deselect paddock and close current info panel
    manager.app.paddockManager.deselectPaddock(paddock);
  };

  //create close button
  var closeButton = ui.Button('Close', closeEvent, false, {});

  // Create panel to encompass these widgets and return it
  var headingPanel = ui.Panel({
    widgets: [
      titleLabel,
      descriptionContainer,
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
var createNDVIVisualiser = function (paddock) {
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

  var dateLabelTextStyle = {
    margin: '6px 0 -3px 8px',
    fontSize: '12px',
    color: 'gray'
  }
  // Encapsulate the date text boxes in a panel that includes a horizontally positioned label
  var startDatePanel = ui.Panel([ui.Label('Start date', dateLabelTextStyle), startDateBox], ui.Panel.Layout.flow('vertical'));
  var endDatePanel = ui.Panel([ui.Label('End date', dateLabelTextStyle), endDateBox], ui.Panel.Layout.flow('vertical'));

  // NDVI chart container. Each time a new graph is created,
  // this panel is cleared and the new chart is added.
  var CHART_POSITION_INDEX = 3;
  var chartContainer = ui.Panel({
    style: {
      minHeight: '450px',
      margin: '10px 0 0 0'
    },
  });

  var loadingChart =  ui.Label({
    value: 'Loading...',
    style: {stretch: 'vertical', color: 'gray', shown: true}
  });

  var loadingState = function (state) {
    // Set the loading label visible.
    loadingChart.style().set('shown', state);
    // disable each widget while loading
    var disableWidget = [
        startDateBox,
        endDateBox,
        visualiseButton
    ];
    debug.info('disable each widget while loading')
    disableWidget.forEach(function(widget) {
      widget.setDisabled(state);
    });
  };

  // hide elevation and soil layers
  var hideEleSoilLayers = function () {
    Map.layers().get(Map.layers().indexOf(manager.currentLayers.Soil)).setShown(false);
    Map.layers().get(Map.layers().indexOf(manager.currentLayers.Elevation)).setShown(false);
  };

  /**
   *
   */
  var addEleSoilImages = function () {
    // visualizing elevation of the paddock,
    // then assign returned layer to Object manager.currentLayers
    manager.currentLayers.Elevation = manager.app.imageVisualiser.displayElevation(
        // the paddock chosen by user
        manager.app.paddocks,
        // the layer name
        'Elvation',
        // clip the imagery to the paddock geometries
        true);

    Map.layers().get(Map.layers().indexOf(manager.currentLayers.Elevation)).setShown(false)
    debug.info("added NDVI layer", Map.layers().get(Map.layers().indexOf(manager.currentLayers.Elevation)));

    // visualizing elevation of the paddock,
    // then assign returned layer to Object manager.currentLayers
    manager.currentLayers.Soil = manager.app.imageVisualiser.displaySoil(
        // the paddock chosen by user
        manager.app.paddocks,
        // the layer name
        'Soil',
        // clip the imagery to the paddock geometries
        true);

    Map.layers().get(Map.layers().indexOf(manager.currentLayers.Soil)).setShown(false);
    debug.info("added soil layer", Map.layers().get(Map.layers().indexOf(manager.currentLayers.Soil)));

    // hide elevation and soil layer
    hideEleSoilLayers();
  };


  /**
   * The function to run when the visualise button's onClick event is triggered.
   * Updates the graph to use the new dates in the start/end date textboxes
   * @param {ui.Button} button - The button that executed this onClick function.
   */
  var visualise = function (button) {
    // show the loading label.
    loadingState(true);
    // the lay select panel
    manager.layerSelectPanel = null;
    // clear all  soil elevation and ndvi layers if exists
    manager.app.imageVisualiser.clearAllNdviLayers();
    // clear all  soil elevation layers if exists
    manager.app.imageVisualiser.clearEleSoilLayers();
    // add elevation and soil layers to the map
    addEleSoilImages();
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

    /*

     */
    var generateChart = function () {
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
        pointSize: 0.8,
        //lineSize: 0.3, // We don't want lines on the 'raw' scatter plot due to inconsistent data coverage
      });

      ndviChart.style().set({
        minWidth: '450px',
        minHeight: '350px'
      });
      debug.info('Created NDVI chart for paddock. Setting it to be a scatter chart.');
      ndviChart.setChartType('ScatterChart');

      return ndviChart;
    };

    var refreshChartContainer = function () {
      var ndviChart = generateChart();
      debug.info("adding the layer select panel");

      // create prompt label for chart
      manager.timeLabel = ui.Label({
        value: '',
        style: {
          fontSize: '10px',
          color: '#2E85F3',
          margin: '5px 0 -5px 20px'
        }
      });
      debug.info("refreshing ndvi chart");


      var chartLabel = ui.Label({
        value: '2) Click a point on the chart to show the NDVI for that date.',
        style: {
          fontSize: '14px',
          fontWeight: 'bold'
        }
      });

      // Clear the chart container panel and add create prompt label for chart
      chartContainer.clear().add(chartLabel);
      //  add the new chart
      chartContainer.add(manager.timeLabel);
      // add click-point time label
      chartContainer.add(ndviChart);
      return ndviChart;
    };

    // refresh chart container for every visualisation
    var ndviChart = refreshChartContainer();

    // When the chart is clicked, update the map and label.
    ndviChart.onClick(function (xValue) {
      if (!xValue) return;  // Selection was cleared.
      // Show the image for the clicked date.
      var date = ee.Date(new Date(xValue));
      debug.info("clicked data is", date);

      // Get the 5 day range (guarantees that at least one data point will be present
      var dateRange = ee.DateRange(date, date.advance(5, 'day'));

      // clear all NDVI and elevation layers before displaying new one
      manager.app.imageVisualiser.clearAllNdviLayers();

      // hide elevation and soil layers
      hideEleSoilLayers();

      // visualizing NDVI of chosen time point of scatter chart on the map,
      // then assign returned layer to Object manager.currentLayers
      manager.currentLayers.NDVI = manager.app.imageVisualiser.displayPaddockNDVIMedian(
          //the clicked date on the scatter chart
          dateRange.start(),
          dateRange.end(),
          // the paddock chosen by user
          paddock.geometry(),
          // the layer name
          'NDVI layer for paddock: ' + manager.id,
          // clip the imagery to the paddock geometries
          true);

      // check if the chart container already contains a layer select panel
      if (manager.layerSelectPanel == null) {
        // add a layer select panel otherwise
        manager.layerSelectPanel = manager.app.layerSelectWidget.createSelectWidget(manager.currentLayers);
        chartContainer.add(manager.app.layerSelectWidget.createSelectWidget(manager.currentLayers));
      }
      // set select value as NDVI
      manager.app.layerSelectWidget.setSelectValue();

      // create timeline widget
      manager.app.timeline.createTimeline(
          manager.app.default.CHART_START_DATE,
          manager.app.default.CHART_END_DATE,
          xValue,
          manager.currentLayers,
          paddock
      );

      manager.timeLabel.setValue("click point time: " + new Date(xValue).toJSON().slice(0, 10));
      debug.info("display NDVI imagery for paddock:", paddock.getString("ID"));
      // create a new NDVI legend widget
      manager.app.legendWidget.showNDVILayer();
    });

    loadingState(false);
  };

  // Visualise button
  var visualiseButton = ui.Button({
    label: 'Visualise',
    onClick: visualise,
  });

  var visualiseButtonContainer = ui.Panel({
    widgets : [visualiseButton, loadingChart],
    layout : ui.Panel.Layout.flow('vertical')
  });

  // Create panel to encompass these widgets and return it
  return ui.Panel({
    widgets: [
      ui.Label('1) Select date range for NDVI images', {fontWeight: 'bold'}),
      startDatePanel,
      endDatePanel,
      visualiseButtonContainer,
      chartContainer,
    ],
  });
};

/**
 * Creates an season comparator for the given paddock.
 * Includes a method of defining seasons (i.e. date ranges) to visualise,
 * then normalises the date ranges and plots ndvi vs. time series for those seasons.
 *
 * @param {ee.Feature} paddock - The paddock to create a season comparator for.
 * @return {ui.Panel} - A panel containing all the widgets involved with the season comparator.
 */
var createSeasonComparator = function (paddock) {
  debug.info('Creating season comparator widget panel for an information panel.');
  var growingSeasons = [];

  // Title label for growing season comparison
  debug.info('Creating title label for growing season comparison.');
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

  var addGrowingSeason = function () {
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
    var removeGrowingSeason = function () {
      debug.info('Executing removeGrowingSeason.');
      // Using a closure to save the plant and panel that it is deleting
      growingSeasons = growingSeasons.filter(function (season) {
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

  var refreshComparisonChart = function () {
    debug.info('Executing refreshComparisonChart.');
    if (growingSeasons.length < 1) {
      return;
    }

    var paddockGeometry = ee.Feature(paddock).getInfo().geometry;
    var data = ee.ImageCollection(manager.app.dataset.filterBounds(paddockGeometry));
    debug.info('Data initial:', data);

    var total = null;
    debug.info('Doing something to growingSeasons:', growingSeasons);
    growingSeasons.map(function (s) {
      var d = ee.ImageCollection(data.filterDate(s[0], s[1]));
      debug.info('d:', d);
      var splitDate = s[0].split("-");
      var months = parseInt(splitDate[1], 10) - 1;
      var days = parseInt(splitDate[2], 10) - 1;

      debug.info('Normalising the dates.');
      // Normalise the dates
      d = ee.ImageCollection(d).map(function (i) {
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
      hAxis: {title: 'Days Since Planting', format: '', gridlines: {count: 12}},
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
  });

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
exports.createInfoPanel = function (paddock) {


  debug.info('Creating an info panel for the paddock:', paddock);
  // Create and add a heading for the info panel
  var headingWidget = createHeading(paddock);


  // ndvi chart visualiser
  var visualiserWidget = createNDVIVisualiser(paddock);

  // Season comparisons
  // var seasonComparatorWidget = createSeasonComparator(paddock);

  // Create and return the info panel
  var infoPanel = ui.Panel({
    widgets: [
      headingWidget,
      visualiserWidget,],
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
