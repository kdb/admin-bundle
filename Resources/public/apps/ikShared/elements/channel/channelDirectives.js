/**
 * @file
 * Contains channel directives.
 */

/**
 * Channel preview directive. Displays the channel preview.
 * Has a play button.
 * When pressing the channel, but not the play button, redirect to the channel editor.
 */
angular.module('ikShared').directive('ikChannel', ['$interval', '$location',
  function($interval, $location) {
    'use strict';

    return {
      restrict: 'E',
      scope: {
        ikWidth: '@',
        ikChannel: '=',
        ikSingleSlide: '=',
        ikClickable: '='
      },
      link: function(scope, element, attrs) {
        scope.slideIndex = 0;
        scope.playText = '';

        // Observe on changes to ik-slide, for when it is set.
        attrs.$observe('ikChannel', function(val) {
          if (!val) {
            return;
          }

          // If channel is empty, display empty channel.
          if (scope.ikChannel.slides.length <= 0) {
            scope.templateURL = 'bundles/os2displayadmin/apps/ikShared/elements/channel/empty.html?' + window.config.version;
          }
          else {
            scope.templateURL = 'bundles/os2displayadmin/apps/ikShared/elements/channel/non-empty.html?' + window.config.version;

            scope.buttonState = 'play';
          }
        });

        /**
         * Start playing the slides.
         */
        scope.play = function() {
          if (angular.isDefined(scope.interval)) {
            $interval.cancel(scope.interval);
            scope.interval = undefined;
            scope.buttonState = 'play';
          } else {
            scope.slideIndex = (scope.slideIndex + 1) % scope.ikChannel.slides.length;

            scope.interval = $interval(function() {
              scope.slideIndex = (scope.slideIndex + 1) % scope.ikChannel.slides.length;
            }, 2000);
            scope.buttonState = 'pause';
          }
        };

        /**
         * Redirect to the channel editor page.
         */
        scope.redirectToChannel = function() {
          if (scope.ikClickable) {
            $location.path('/channel/' + scope.ikChannel.id);
          }
        };

        // Register event listener for destroy.
        //   Cleanup interval.
        scope.$on('$destroy', function() {
          if (angular.isDefined(scope.interval)) {
            $interval.cancel(scope.interval);
            scope.interval = undefined;
          }
        });
      },
      templateUrl: 'bundles/os2displayadmin/apps/ikShared/elements/channel/channel-template.html?' + window.config.version
    };
  }
]);
