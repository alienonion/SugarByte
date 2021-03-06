/**
 * @fileoverview This file includes functions for masking clouds and shadows.
 * It currently has ONLY ONE function for masking clouds from either Sentinel or Landsat-8 imagery.
 * No other functions have been included because they do not provide any
 * meaningful outputs (e.g. QA bitmasking).
 * However, the file is structured to allow other potentially useful cloud masking functions
 * to be added without the need for major refactoring.
 */

// Sentinel string values for relevant bands and properties
var SENTINEL = {
  BAND: {
    CB: 'B1',
    BLUE: 'B2',
    GREEN: 'B3',
    RED: 'B4',
    NIR: 'B8',
    WP: 'B9',
    CIRRUS: 'B10',
    SWIR1: 'B12',
    QA: 'QA60'
  }
};

// Landsat string values for relevant bands and properties
var LANDSAT = {
  BAND: {
    BLUE: 'B2',
    GREEN: 'B3',
    RED: 'B4',
    NIR: 'B5',
    SWIR1: 'B6',
    SWIR2: 'B7',
    TEMP: 'B10'
  }
};

// Satellite IDs
var SATELLITE = {
    LANDSAT: 1,
    SENTINEL: 2
};
// Make IDs available for other scripts. They should use them.
exports.SATELLITE = SATELLITE;

/**
 * Masks clouds and shadows from a Sentinel2 image.
 *
 * Utilises a custom cloud scoring algorithm.
 * Parameters that require an ee object WILL NOT accept ordinary JS variables.
 *
 * @param {ee.ImageCollection} images - The images to mask clouds and shadows from.
 *      Band values for Landsat and Sentinel collections must not be scaled from their original values.
 *      Band names must be their original strings
 * @param {ee.Number} satellite - The ID of satellite being used (i.e. 1 = LANDSAT, 2 = SENTINEL)
 * @param {ee.Number} [threshold=20] - The Cloud Threshold to use. Range: [1,100]
 *      Lower value will mask more pixels out. Generally 10-30 works well with 20 being used most commonly.
 * @param {ee.Number} [dilation=2] - The number of pixels to dilate around clouds. Range: [0,100]
 * @param {ee.Number} [contraction=1] - The number of adjacent pixels required by a cloud pixel to also be
 *      cloud pixels. Used to reduce inclusion of single-pixel commission errors. Range: [0,100]
 *
 * @return {ImageCollection} The same set of images given, but with clouds masked out.
 *      The "system:time_start" property of each image is retained.
 *
 * @example
 *      var masking = require(<filepath to this file>);
 *      var maskedScoring = ee.ImageCollection(masking.maskCloudsScoring(
            someImages,
            masking.SATELLITE.SENTINEL,
            ee.Number(15),
            ee.Number(2),
            ee.Number(1)));
 */
exports.maskCloudsScoring = function(images, satellite, threshold, dilation, contraction) {
  // Settings utilised by both landsat and sentinel algorithms.
  // Parameters are checked for being ee.Number objects, then checked for values.
  function checkParameter(parameter, settings) {
    var value = ee.Number(ee.Algorithms.If(
        parameter instanceof ee.Number, ee.Algorithms.If(
            ee.Number(parameter).gte(settings.MIN).and(ee.Number(parameter).lte(settings.MAX)),
            parameter, settings.DEFAULT), // Set to default if outside range
        settings.DEFAULT)); // Set to default if not an ee.Number
    return value;
  }
  // Cloud Threshold
  var THRESHOLD_SETTINGS = {
    MIN: ee.Number(1),
    MAX:  ee.Number(100),
    DEFAULT: ee.Number(20)
  };
  var cloudThresh = checkParameter(threshold, THRESHOLD_SETTINGS);
  // Pixel Dilation
  var DILATION_SETTINGS = {
    MIN: ee.Number(0),
    MAX:  ee.Number(100),
    DEFAULT: ee.Number(2)
  };
  var dilatePixels = checkParameter(dilation, DILATION_SETTINGS);
  // Pixel Contraction
  var CONTRACTION_SETTINGS = {
    MIN: ee.Number(0),
    MAX:  ee.Number(100),
    DEFAULT: ee.Number(1)
  };
  var contractPixels = checkParameter(contraction, CONTRACTION_SETTINGS);

  // Cloud Score values
  var VALUES = {
    SENTINEL: {
      BLUE: [0.1, 0.5],
      AEROSOLS: [0.1, 0.3],
      CIRRUS: [0.15, 0.2],
      RGB: [0.2, 0.8],
      NDMI: [-0.1, 0.1],
      NDSI: [0.8, 0.6]
    },
    LANDSAT: {
      BLUE: [0.1, 0.3],
      RGB: [0.2, 0.8],
      INFRARED: [0.3, 0.8],
      TEMP: [300, 290],
      NDMI: [0.8, 0.6]
    }
  };

  // A helper to apply an expression and linearly rescale the output.
  var rescale = function(img, exp, thresholds) {
    return ee.Image(img).expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
  };

  // Mask the image based on the cloud scores
  var maskClouds = function(score, rawImage) {
    score = ee.Image(score.multiply(100).byte());
    var img = ee.Image(rawImage).addBands(score.rename('cloudScore'));
    var mask = img.select(['cloudScore'])
        .gt(cloudThresh)
        .focal_min(contractPixels)
        .focal_max(dilatePixels)
        .not();
    return img.updateMask(mask)
        .copyProperties(rawImage, ["system:time_start"]);
  };

  // The scoring algorithm for Sentinel images
  var scoreSentinel = function(rawImage) {
    var img = ee.Image(rawImage.divide(10000));
    var score = ee.Image(1);

    // Clouds are reasonably bright in the blue and cirrus bands.
    score = score.min(rescale(img, 'img.' + SENTINEL.BAND.BLUE, VALUES.SENTINEL.BLUE));
    score = score.min(rescale(img, 'img.' + SENTINEL.BAND.CB, VALUES.SENTINEL.AEROSOLS));
    score = score.min(rescale(img,
        'img.' + SENTINEL.BAND.CB + ' + img.' + SENTINEL.BAND.CIRRUS,
        VALUES.SENTINEL.CIRRUS));

    // Clouds are reasonably bright in all visible bands.
    score = score.min(rescale(img,
        'img.' + SENTINEL.BAND.RED +
            ' + img.' + SENTINEL.BAND.GREEN +
            ' + img.' + SENTINEL.BAND.BLUE,
        VALUES.SENTINEL.RGB));

    // Clouds are moist
    var ndmi = img.normalizedDifference([SENTINEL.BAND.NIR, SENTINEL.BAND.SWIR1]);
    score = score.min(rescale(ndmi, 'img', VALUES.SENTINEL.NDMI));

    // Probably don't need to worry about snow for sugarcane paddocks in Queensland.
    // It could be useful for detecting hail?
    /*
    // However, clouds are not snow.
    var ndsi = img.normalizedDifference([SENTINEL.BAND.GREEN, SENTINEL.BAND.SWIR1]);
    score = score.min(rescale(ndsi, 'img', VALUES.SENTINEL.NDSI));
    */
    return score;
  };

  // The scoring algorithm for Landsat images
  var scoreLandsat = function(rawImage) {
    var img = ee.Image(rawImage.divide(100000));

    var score = ee.Image(1);

    // Clouds are reasonably bright in the blue band.
    score = score.min(rescale(img,
        'img.' + LANDSAT.BAND.BLUE,
        VALUES.LANDSAT.BLUE));

    // Clouds are reasonably bright in all visible bands.
    score = score.min(rescale(img,
        'img.' + LANDSAT.BAND.RED +
            ' + img.' + LANDSAT.BAND.GREEN +
            ' + img.' + LANDSAT.BAND.BLUE,
        VALUES.LANDSAT.RGB));

    // Clouds are reasonably bright in all infrared bands.
    score = score.min(rescale(img,
        'img.' + LANDSAT.BAND.NIR +
            ' + img.' + LANDSAT.BAND.SWIR1 +
            ' + img.' + LANDSAT.BAND.SWIR2,
        VALUES.LANDSAT.INFRARED));
    // Clouds are reasonably cool in temperature.
    score = score.min(rescale(img, 'img.' + LANDSAT.BAND.TEMP, VALUES.LANDSAT.TEMP));

    // However, clouds are not snow.
    var ndsi = img.normalizedDifference([LANDSAT.BAND.GREEN, LANDSAT.BAND.SWIR1]);
    score.min(rescale(ndsi, 'img', VALUES.LANDSAT.NDMI));
    return score;
  };

  var maskSentinel = function(rawImage) {
    // Compute several indicators of cloudyness and take the minimum of them.
    var score = scoreSentinel(rawImage);
    return maskClouds(score, rawImage);
  };

  var maskLandsat = function(rawImage) {
    // Compute several indicators of cloudyness and take the minimum of them.
    var score = scoreLandsat(rawImage);
    return maskClouds(score, rawImage);
  };

  // Map an algorithm to the image collection based on whether it is sentinel or landsat
  var sentinel = function(images) {return images.map(maskSentinel)};
  var landsat = function(images) {return images.map(maskLandsat)};
  var maskedImages = ee.Algorithms.If(
    ee.Algorithms.IsEqual(SATELLITE.SENTINEL, satellite), // If it's a sentinel image
    sentinel(images),
    ee.Algorithms.If(
      ee.Algorithms.IsEqual(SATELLITE.LANDSAT, satellite), // If it's a landsat image
      landsat(images)
    )
  );
  return maskedImages;
};
