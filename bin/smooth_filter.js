exports.doc = 'Function which takes a dataset and smoothes it.';

/*
  Filters out 'extreme' values from dataset
  Extreme is judged by whether the normalized difference between the singular
  datapoint and the data points in the 2 months surrounding the point exceeds a
  given threshold

  Can be applied twice with a decreasing threshold for better results

  @param {ee.ImageCollection} dataset - dataset of images to remove extreme
      values from
  @param {Integer} threshhold - the threshhold that must be exceeded for a datapoint
      to be considered extreme (recommended to be 0.07 for NDVI values post cloud
      masking)

  @return the same dataset with extreme values replaced with the average of the
      surrounding 2 months' ndvi values
*/
exports.filterExtremes = function(dataset, threshhold) {

  // Get dates over which to analyse
  var dates = ee.List(dataset.aggregate_array('system:time_start'));

  var filtered = ee.ImageCollection(dates.map(function(d) {
    // Make date out of current date
    var date = ee.Date(d);

    // Get average over the surrounding 2 months
    var avg = dataset.filterDate(date.advance(-30, 'day'), date.advance(30, 'day'))
                  .mean()
                  .select('NDVI');

    // The average over the surrounding 3 days (just this date)
    var cur = dataset.filterDate(date.advance(-1, 'day'), date.advance(1, 'day'))
        .mean().select('NDVI');

    // Calculate the normalised difference between the two
    var dif = avg.subtract(cur).divide(avg.add(cur));

    // Expression: if the dif is above threshhold, replace with the average
    var result = dif.expression(
        "(b('NDVI') > THRESH) ? AVG : DEFAULT",
        {
          'THRESH': threshhold,
          'AVG' : avg,
          'DEFAULT': cur,
        }
      );

    // Set system:time_start and return
    return result.set('system:time_start', date.millis());
  }));

  return filtered;
};

/*
  Smoothes a dataset to produce a smooth chart line

  Replaces each data point with the average value across the surrounding windowSize number of days

  @param {ee.ImageCollection} dataset - dataset to be smoothed
  @param {Integer} windowSize - the amount of days to average across for each value

  @return {ee.ImageCollection} The smoothed set of values
*/
exports.smoothDataset = function(dataset, windowSize) {

  // Get the dates across which to smooth
  var dates = ee.List(dataset.aggregate_array('system:time_start'));

  var smoothed = ee.ImageCollection(dates.map(function(d) {
    var date = ee.Date(d);

    // Calculate the average NDVI across the window size on each side
    var avg = dataset.filterDate(date.advance(-windowSize, 'day'), date.advance(windowSize, 'day'))
                  .mean()
                  .select('NDVI');

    // Return with system:time_start set
    return avg.set('system:time_start', date.millis());
  }));

  return smoothed;
}









    // I believe this is part of the solution to us speeding up the smooth function. -Troy
    /*
    var specimen = filtered.map(function(image) {
        return image.set('mean', image.reduceRegion(ee.Reducer.mean(), manager.paddock))});
    print('specimen', specimen)
    */
