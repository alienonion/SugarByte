/**
 * @fileoverview This is the UI tool that let user switch between soil, NDVI and elevation layers
 */

var manager = {};

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

manager.createVariables = function(app) {
  manager.app = app;
  // current NDVI and elevation layers
  manager.currentLayers = {};
  // select box container
  manager.selectBoxContainer = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
    style: {
      maxWidth: '250px',
      position: 'top-center',
    }
  })
  // the layer-select-panel contains time label and select box container
  manager.layerSelectPanel = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
    style: {
      maxWidth: '250px',
      position: 'middle-left',
    }
  });
};

/**
 * to create the layer select panel.
 */
var createSelectWidget = function() {
  manager.layerSelectPanel.clear();
  // create a label to prompt users that points on map can be clicked to show the NDVI for that day on the map
  manager.timeLabel = ui.Label({
    value: 'Click a point on the chart to show the NDVI for that date.',
    style: {
      position: 'top-center',
      height: '30px',
    }
  });
  debug.info("created time label");

  manager.layerSelectPanel.add(manager.timeLabel)
  // add the layer select panel to the map
  Map.add(manager.layerSelectPanel);
};

exports.updateTimeLabel = function(xValue) {
  // Show a label with the date on the map.
  manager.timeLabel.setValue("click point time: "+ new Date(xValue).toJSON().slice(0,10));
}

/**
 create select widget represents a drop-down menu of layers from which the user can choose one.
 */
exports.createSelectButton = function (layers) {
  manager.currentLayers = layers;
  // remove old select box container before adding new one
  manager.layerSelectPanel.remove(manager.selectBoxContainer);
  // clear all elements in select box container
  manager.selectBoxContainer.clear();

  // create a label to prompt users to select the layer to show
  var selectBoxTitle = ui.Label({
    value: 'Please select the layer to show',
    style: {
      position: 'top-center',
      height: '30px',
      backgroundColor: '#dcf0e4',
      fontWeight: 'bold',
      fontFamily: 'Comic Sans MS',
    }
  });
  debug.info('Created select box title');

  //select widget represents a drop-down menu of layers from which the user can choose one.
  var selectBox = ui.Select({
    items: Object.keys(manager.currentLayers),
    onChange: function (key) {
      // get the index of layer to show
      var indexOfShownLayer = Map.layers().indexOf(manager.currentLayers[key]);
      // make chosen layer visible
      Map.layers().get(indexOfShownLayer).setShown(true);

      // find the index of layers in Map.layers() list
      var soilLayerIndex = Map.layers().indexOf(manager.currentLayers.soil);
      var elevationLayerIndex = Map.layers().indexOf(manager.currentLayers.elevation);
      var ndviLayerIndex = Map.layers().indexOf(manager.currentLayers.NDVI);

      // a switch statement to hide unselected layer
      switch (manager.currentLayers[key]) {
        case manager.currentLayers.NDVI: // when the chosen layer is NDVI
          // set other layers invisible
          Map.layers().get(soilLayerIndex).setShown(false);
          Map.layers().get(elevationLayerIndex).setShown(false);
          // remove elevation legend widget if exists
          manager.app.elevationLegendWidget.removeWidget();
          // create a new NDVI legend widget
          manager.app.legendWidget.initialise(manager.app);
          break;

        case manager.currentLayers.elevation: // when the chosen layer is elevation
          // set NDVI layer invisible
          Map.layers().get(soilLayerIndex).setShown(false);
          Map.layers().get(ndviLayerIndex).setShown(false);
          // remove NDVI legend widget if exists
          manager.app.legendWidget.removeWidget();
          // create a new NDVI legend widget
          manager.app.elevationLegendWidget.initialise(manager.app);
          break;

        case manager.currentLayers.soil: // when the chosen layer is soil
          // set other two layers invisible
          Map.layers().get(elevationLayerIndex).setShown(false);
          Map.layers().get(ndviLayerIndex).setShown(false);
          // remove NDVI legend widget if exists
          manager.app.legendWidget.removeWidget();
          manager.app.elevationLegendWidget.removeWidget();
          break;
      }
    }
  });
  // Set a place holder.
  selectBox.setPlaceholder('Choose a layer...');
  // add select box title and select Box to the container
  manager.selectBoxContainer.add(selectBoxTitle);
  manager.selectBoxContainer.add(selectBox);
  // add select box container to layer-select-panel
  manager.layerSelectPanel.add(manager.selectBoxContainer);
};

exports.createPanel = function(app) {
  debug.info('Initialising layer select widget.');
  manager.createVariables(app);
  createSelectWidget();
};

exports.closePanelWidgets = function () {
  //remove layer select panel
  if (manager.layerSelectPanel !== null) {
    Map.remove(manager.layerSelectPanel);
    debug.info("layer select panel removed");
  }
  // remove this panel's NDVI layer after closing
  manager.app.imageVisualiser.clearAllNdviLayers();
  // remove this panel's legend widget after closing
  manager.app.legendWidget.removeWidget();
  manager.app.elevationLegendWidget.removeWidget();
};
