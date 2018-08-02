/**
 * @file
 * Contains channel share directives.
 */

/**
 * channel-share directive.
 *
 * Enables sharing a channel.
 *
 * html-parameters
 *   ikChannel (object): Channel to share.
 */
angular.module('ikShared').directive('ikChannelShare', [
  function () {
    'use strict';

    return {
      restrict: 'E',
      scope: {
        ikChannel: '='
      },
      link: function (scope) {
        scope.clickShare = function () {
          scope.$emit('ikChannelShare.clickShare', scope.ikChannel);
        };
      },
      templateUrl: 'bundles/os2displayadmin/apps/ikShared/elements/channelShare/channel-share.html?' + window.config.version
    };
  }
]);
