/*
  Legend Widget
*/

var manager = {};

var debug = require('users/balddinosaur/sugarbyte:bin/debug.js');

manager.createVariables = function(app) {
  manager.app = app;
};

manager.createUi = function() {

  // Master panel
  manager.legend = ui.Panel({
    style: {
      position: 'bottom-center',
      padding: '8px 15px'
    },
    layout: ui.Panel.Layout.flow('horizontal'),
  });

  // Legend title
  var legendTitle = ui.Label({
    value: 'NDVI Legend',
    style: {
      fontWeight: 'bold',
      fontSize: '18px',
      margin: '0 0 4px 0',
      padding: '0'
      }
  });
  manager.legend.add(legendTitle);


  // create the legend image
  var lon = ee.Image.pixelLonLat().select('longitude');
  var gradient = lon.multiply((manager.app.vis.max - manager.app.vis.min)/100.0).add(manager.app.vis.min);
  var legendImage = gradient.visualize(manager.app.vis);

  // Minimum value label
  manager.legend.add(ui.Label(manager.app.vis.min));

  // Thumbnail for the image
  var thumbnail = ui.Thumbnail({
    image: legendImage,
    params: {bbox:'0,0,100,10', dimensions:'200x10'},
    style: {padding: '1px', position: 'bottom-center'}
  });

  manager.legend.add(thumbnail);

  // Max value label
  manager.legend.add(ui.Label(manager.app.vis.max));

  Map.add(manager.legend);
};


exports.initialise = function(app) {
  debug.info('Initialising legendWidget.');

  manager.createVariables(app);
  manager.createUi();
};

exports.removeWidget = function() {
    debug.info('Remove elevation legend widget. ');
    Map.remove(manager.legend)
}
