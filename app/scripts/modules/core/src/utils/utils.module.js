'use strict';

import { RENDER_IF_FEATURE } from './renderIfFeature.component';
import { COPY_TO_CLIPBOARD_COMPONENT } from './clipboard/copyToClipboard.component';
import { TIME_FORMATTERS } from './timeFormatters';
import { SELECT_ON_DOUBLE_CLICK_DIRECTIVE } from 'core/utils/selectOnDblClick.directive';

const angular = require('angular');

module.exports = angular.module('spinnaker.utils', [
  require('./moment.js').name,
  require('./appendTransform.js').name,
  COPY_TO_CLIPBOARD_COMPONENT,
  TIME_FORMATTERS,
  SELECT_ON_DOUBLE_CLICK_DIRECTIVE,
  require('./infiniteScroll.directive.js').name,
  RENDER_IF_FEATURE,
  require('./waypoints/waypoint.directive').name,
  require('./waypoints/waypointContainer.directive').name,
]);
