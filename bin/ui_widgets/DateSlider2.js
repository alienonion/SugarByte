var mod09ga = ee.ImageCollection("MODIS/006/MOD09GA");
var start = "2016-1-1";
var end = "2017-1-1";
var showImage = function(range){
  print("---", range);
  var col = mod09ga.filterDate(range.start(), range.end());
  var mosaic = col.mosaic().unitScale(0, 10000);
  var visParams = {bands: ["sur_refl_b01","sur_refl_b04","sur_refl_b03"], min: 0, max:1};
  var layer = ui.Map.Layer(mosaic, visParams, "layer");
  Map.layers().set(0, layer);
};

showImage(ee.DateRange(start, ee.Date(start).advance(1, "day")));
ee.DateRange(start, end).evaluate(function(range) {
  print("+++",range);
  var dateSlider = ui.DateSlider({
    start: range['dates'][0],
    end: range['dates'][1],
    value: "2016-2-2",
    period: 1,
    onChange: showImage,
    style: {
      minWidth: '500px',
      padding: '5px',
      whiteSpace: 'pre',
      fontSize: '15px'
    }
  });
  var main_panel = ui.Panel({
    widgets: [dateSlider],
    style: {
      width: "280px",
      padding: "4px"
    }
  });
  ui.root.insert(0, main_panel);
});