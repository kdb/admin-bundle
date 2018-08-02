/**
 * @file
 * Slide creation controllers.
 */

/**
 * Slide controller. Controls the slide creation/edit process.
 */
angular.module('ikApp').controller('SlideController', ['$scope', '$controller', '$location', '$routeParams', '$timeout', 'slideFactory', 'templateFactory', 'channelFactory', 'busService', 'userService',
  function ($scope, $controller, $location, $routeParams, $timeout, slideFactory, templateFactory, channelFactory, busService, userService) {
    'use strict';

    $controller('BaseEntityController', {$scope: $scope, entityType: 'slide'});

    $scope.steps = 6;
    $scope.slide = {};
    $scope.templates = [];
    templateFactory.getEnabledSlideTemplates().then(
      function success(data) {
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            $scope.templates.push(data[key]);
          }
        }
      },
      function error(reason) {
        busService.$emit('log.error', {
          'cause': reason,
          'msg': 'Kunne ikke hente slide templates.'
        });
      }
    );

    // Setup the editor.
    $scope.editor = {
      channelOverviewEditor: false,
      toggleChannelOverviewEditor: function () {
        busService.$emit('bodyService.toggleClass', 'is-locked');
        $scope.editor.channelOverviewEditor = !$scope.editor.channelOverviewEditor;
      }
    };

    // Register event listener for clickSlide.
    $scope.$on('channelOverview.clickChannel', function (event, channel) {
      $scope.toggleChannel(channel);
    });

    /**
     * Load a given step
     */
    function loadStep(step) {
      $scope.step = step;
      $scope.templatePath = 'bundles/os2displayadmin/apps/ikApp/pages/slide/slide-step' + $scope.step + '.html?' + window.config.version;
    }

    /**
     * Constructor.
     * Handles different settings of route parameters.
     */
    function init() {
      if (!$routeParams.id) {
        // If the ID is not set, get an empty slide.
        $scope.slide = slideFactory.emptySlide();
        $scope.slide.channels = [];
        loadStep(1);
      }
      else {
        if ($routeParams.id === null || $routeParams.id === undefined || $routeParams.id === '') {
          $location.path('/slide');
        }
        else {
          // Make sure we load a fresh version of the slide.
          slideFactory.clearCurrentSlide();

          // Get the slide from the backend.
          slideFactory.getEditSlide($routeParams.id).then(
            function success(data) {
              $scope.slide = data;
              $scope.slide.status = 'edit-slide';
              if ($scope.slide === {}) {
                $location.path('/slide');
              }

              // Go to step 3 (edit content)
              loadStep(3);
            },
            function error(reason) {
              busService.$emit('log.error', {
                'cause': reason,
                'msg': 'Kunne ikke hente slide med id: ' + $routeParams.id
              });
              $location.path('/slide-overview');
            }
          );
        }
      }
    }

    init();

    /**
     * Submit a step in the installation process.
     */
    $scope.submitStep = function () {
      if ($scope.step === $scope.steps) {
        $scope.disableSubmitButton = true;

        // Set default duration if none is set.
        if ($scope.slide.duration === '') {
          $scope.slide.duration = 15;
        }

        slideFactory.saveSlide().then(
          function success() {
            busService.$emit('log.info', {
              'msg': 'Slide er gemt',
              'timeout': 3000
            });

            $timeout(function () {
              $location.path('/slide-overview');
            }, 1000);
          },
          function error(reason) {
            busService.$emit('log.error', {
              'cause': reason,
              'msg': 'Kunne ikke gemme slide'
            });
            $scope.disableSubmitButton = false;
          }
        );
      }
      else {
        loadStep($scope.step + 1);
      }
    };

    /**
     * Validates that @field is not empty on slide.
     */
    function validateNotEmpty(field) {
      if (!$scope.slide) {
        return false;
      }
      return $scope.slide[field] !== '';
    }

    /**
     * Handles the validation of the data in the slide.
     */
    $scope.validation = {
      titleSet: function () {
        return validateNotEmpty('title');
      },
      templateSet: function () {
        return validateNotEmpty('template');
      }
    };

    /**
     * Go the given step in the creation process, if the requirements have been met to be at that step.
     * @param step
     */
    $scope.goToStep = function (step) {
      var s = 1;
      if ($scope.validation.titleSet()) {
        s++;
        if ($scope.validation.templateSet()) {
          s = s + 4;
        }
      }
      if (step <= s) {
        loadStep(step);
      }
    };

    /**
     * Set the template id of a slide.
     * Update the options attribute to add fields that are needed for the template.
     *
     * @param id
     */
    $scope.selectTemplate = function (id) {
      // Set name of template.
      $scope.slide.template = id;

      // Find selected template.
      var template = null;
      $scope.templates.forEach(function (element) {
        if (element.id === id) {
          template = element;
        }
      });

      // Bail out if no template is selected.
      if (template === null) {
        return;
      }

      // Set calendar type
      $scope.slide.slide_type = template.slide_type;

      // Make sure the options field has been set.
      if (!$scope.slide.options) {
        $scope.slide.options = {};
      }

      // Set orientation.
      $scope.slide.orientation = template.orientation;

      // Update options field.
      angular.forEach(template.empty_options, function (value, key) {
        if ($scope.slide.options[key] === undefined) {
          $scope.slide.options[key] = angular.copy(value);
        }
      });

      // Set the headline equal to the title, if it is empty.
      if ($scope.slide.options.headline === '') {
        $scope.slide.options.headline = $scope.slide.title;
      }

      // Get the media type from the template.
      $scope.slide.media_type = template.media_type;
    };

    /**
     * Is the channel selected?
     * @param channel
     * @returns {boolean}
     */
    $scope.channelSelected = function (channel) {
      var res = false;

      $scope.slide.channels.forEach(function (slideChannel) {
        if (channel.id === slideChannel.id) {
          res = true;
        }
      });

      return res;
    };

    /**
     * Check if channel is included in the current screen.
     * @param channel
     * @returns {boolean}
     */
    $scope.hasChannel = function hasChannel(channel) {
      var res = false;

      $scope.slide.channels.forEach(function (element) {
        if (channel.id === element.id) {
          res = true;
        }
      });
      return res;
    };

    /**
     * Add remove a channel.
     * @param channel
     */
    $scope.toggleChannel = function (channel) {
      var index = null;

      $scope.slide.channels.forEach(function (slideChannel, channelIndex) {
        if (channel.id === slideChannel.id) {
          index = channelIndex;
        }
      });

      if (index !== null) {
        $scope.slide.channels.splice(index, 1);
      }
      else {
        $scope.slide.channels.push(channel);
      }
    };
  }
]);
