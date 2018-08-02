/**
 * @file
 * Contains channel directives.
 */

/**
 * Shared channel preview directive. Displays the channel preview.
 * Has a play button.
 * When pressing the channel, but not the play button, redirect to the channel editor.
 */
angular.module('ikShared').directive('ikSharedChannel', ['$interval', '$location',
  function($interval, $location) {
    'use strict';

    return {
      restrict: 'E',
      scope: {
        ikWidth: '@',
        ikChannel: '=',
        ikSingleSlide: '@',
        ikSharingIndex: '=',
        ikClickable: '='
      },
      link: function(scope) {
        scope.slideIndex = 0;
        scope.playText = '';

        // Observe on changes to ik-slide, for when it is set.
        scope.$watch('ikChannel', function (val) {
          if (!val) {
            return;
          }

          // If channel is empty, display empty channel.
          if (scope.ikChannel.slides.length <= 0) {
            scope.templateURL = 'bundles/os2displayadmin/apps/ikShared/elements/sharedChannel/empty-channel.html?' + window.config.version;
          }
          else {
            scope.templateURL = 'bundles/os2displayadmin/apps/ikShared/elements/sharedChannel/non-empty-channel.html?' + window.config.version;

            scope.buttonState = 'play';
          }

          // Injector stylesheets
          scope.ikChannel.slides.forEach(function (el) {
            // Inject stylesheets not already present in installation.
            if (!$('head > link[href=\''+ el.css_path + '\']')) {
              $('head').append('<link rel="stylesheet" href="' + el.css_path + '" type="text/css" />');
            }
          });
        });

        /**
         * Start playing the slides.
         */
        scope.play = function play() {
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
        scope.redirectToChannel = function redirectToChannel() {
          if (scope.ikClickable) {
            $location.path("/shared-channel/" + scope.ikChannel.unique_id + "/" + scope.ikSharingIndex);
          }
        };

        // Register event listener for destroy.
        //   Cleanup interval.
        scope.$on('$destroy', function () {
          if (angular.isDefined(scope.interval)) {
            $interval.cancel(scope.interval);
            scope.interval = undefined;
          }
        });
      },
      templateUrl: 'bundles/os2displayadmin/apps/ikShared/elements/sharedChannel/shared-channel-template.html?' + window.config.version
    };
  }
]);
