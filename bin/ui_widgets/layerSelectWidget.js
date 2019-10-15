/**
 * @fileoverview This is the UI tool that let user switch between soil, NDVI and elevation layers
 */

var manager = {};

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

exports.initialise = function(app) {
  manager.app = app;
  // current NDVI and elevation layers
  manager.currentLayers = {};

  // select box container
  manager.selectBoxContainer = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
    style: {
      maxWidth: '350px',
      position: 'top-center',
    }
  });
};

/**
 * to create the layer select panel.
 */

exports.setSelectValue = function() {
  // set select value NDVI
  manager.selectBox.setValue('NDVI', true)
}

/**
 create select widget represents a drop-down menu of layers from which the user can choose one.
 */
exports.createSelectWidget = function (layers) {


  // the layer-select-panel contains time label and select box container
  manager.layerSelectPanel = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
    style: {
      margin: '0 0 100px 0'
    }
  });

  manager.currentLayers = layers;

  // clear all elements in select box container
  manager.selectBoxContainer.clear();

  // create a label to prompt users to select the layer to show
  var selectBoxTitle = ui.Label({
    value: 'Switch layers between NDVI, Elvation and Soil',
    style: {
      position: 'top-center',
      fontWeight: 'bold',
    }
  });
  debug.info('Created select box title');

  //select widget represents a drop-down menu of layers from which the user can choose one.
  manager.selectBox = ui.Select({
    items: Object.keys(manager.currentLayers),
    placeholder: 'NDVI',
    onChange: function (key) {
      // get the index of layer to show
      var indexOfShownLayer = Map.layers().indexOf(manager.currentLayers[key]);
      // make chosen layer visible
      Map.layers().get(indexOfShownLayer).setShown(true);

      // find the index of layers in Map.layers() list
      var soilLayerIndex = Map.layers().indexOf(manager.currentLayers.Soil);
      var elevationLayerIndex = Map.layers().indexOf(manager.currentLayers.Elevation);
      var ndviLayerIndex = Map.layers().indexOf(manager.currentLayers.NDVI);

      // a switch statement to hide unselected layer
      switch (manager.currentLayers[key]) {
        case manager.currentLayers.NDVI: // when the chosen layer is NDVI
          // set other layers invisible
          Map.layers().get(soilLayerIndex).setShown(false);
          Map.layers().get(elevationLayerIndex).setShown(false);
          manager.app.legendWidget.showNDVILayer();
          break;

        case manager.currentLayers.Elevation: // when the chosen layer is elevation
          // set NDVI layer invisible
          Map.layers().get(soilLayerIndex).setShown(false);
          Map.layers().get(ndviLayerIndex).setShown(false);
          manager.app.legendWidget.showElevationLayer();
          break;

        case manager.currentLayers.Soil: // when the chosen layer is soil
          // set other two layers invisible
          Map.layers().get(elevationLayerIndex).setShown(false);
          Map.layers().get(ndviLayerIndex).setShown(false);
          // todo
          manager.app.legendWidget.hideAllLegends();
          break;
      }
    }
  });
  // add select box title and select Box to the container
  manager.selectBoxContainer.add(selectBoxTitle);
  manager.selectBoxContainer.add(manager.selectBox);
  // add select box container to layer-select-panel
  manager.layerSelectPanel.add(manager.selectBoxContainer);

  debug.info('Created layer select widget');
  // return this layer select Panel
  return manager.layerSelectPanel;
};
