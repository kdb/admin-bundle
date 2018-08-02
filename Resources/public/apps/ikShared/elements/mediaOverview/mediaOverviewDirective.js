/**
 * @file
 * Contains the media overview directive.
 */

/**
 * Media Overview Directive.
 *
 * Directive to insert a media overview.
 *
 * Emits the mediaOverview.selectMedia event when a media from the overview has been clicked.
 *
 * @param media-type
 *   which media type should be shown, "image" or "video",
 *   leave out show all media.
 */
angular.module('ikShared').directive('ikMediaOverview', [
  'busService',
  function (busService) {
    'use strict';

    return {
      restrict: 'E',
      scope: {
        ikMediaType: '=',
        ikAutoSearch: '@',
        ikHideFilters: '=',
        ikSelectedMedia: '='
      },
      controller: function ($scope, $filter, $controller, mediaFactory) {
        $controller('BaseSearchController', {$scope: $scope});

        // Get filter selection "all/mine" from localStorage.
        $scope.showFromUser = localStorage.getItem('overview.media.search_filter_default') ?
          localStorage.getItem('overview.media.search_filter_default') :
          'all';

        // Set default media type.
        $scope.media_type = 'all';

        // Media to display.
        $scope.media = [];

        var previousSearchIds = null;

        /**
         * Updates the images array by sending a search request.
         */
        $scope.updateSearch = function updateSearch() {
          // Get search text from scope.
          $scope.baseQuery.text = $scope.search_text;

          $scope.loading = true;

          mediaFactory.searchMedia($scope.baseQuery).then(
            function (data) {
              // Total hits.
              $scope.hits = data.hits;

              // Extract search ids.
              var ids = [];
              for (var i = 0; i < data.results.length; i++) {
                ids.push(data.results[i].id);
              }

              // Only extract new results if new results.
              if (previousSearchIds &&
                  ids.length === previousSearchIds.length &&
                  ids.every(function(v,i) { return v === previousSearchIds[i]})
              ) {
                $scope.loading = false;
                return;
              }

              previousSearchIds = ids;

              mediaFactory.loadMediaBulk(ids).then(
                function success(data) {
                  $scope.media = data;

                  $scope.loading = false;
                },
                function error(reason) {
                  busService.$emit('log.error', {
                    'cause': reason,
                    'msg': 'Hentning af søgeresultater fejlede.'
                  });
                  $scope.loading = false;
                }
              );
            }
          );
        };

        /**
         * Returns true if media is in selected media array.
         *
         * @param media
         * @returns {boolean}
         */
        $scope.mediaSelected = function mediaSelected(media) {
          if (!$scope.ikSelectedMedia) {
            return false;
          }

          var res = false;

          $scope.ikSelectedMedia.forEach(function (element) {
            if (element.id === media.id) {
              res = true;
            }
          });

          return res;
        };

        /**
         * Set the media type to filter on.
         * @param type
         */
        $scope.filterMediaType = function filterMediaType(type) {
          // Only update search if value changes.
          if ($scope.media_type !== type) {
            // Update scope to show selection in GUI.
            $scope.media_type = type;

            $scope.setSearchFilters();
          }
        };

        /**
         * Updates the search filter based on current orientation and user
         */
        $scope.setSearchFilters = function setSearchFilters() {
          delete $scope.baseQuery.filter;

          // No groups selected and "all" selected => select all groups and my.
          var selectedGroupIds = $filter('filter')($scope.userGroups, { selected: true }, true).map(function (group) {
            return group.id;
          });

          var filter = $scope.baseBuildSearchFilter(selectedGroupIds);

          // Filter based on media type.
          if ($scope.media_type !== 'all') {
            var term = {};
            term.term = {
              media_type: $scope.media_type
            };

            if ($scope.showFromUser === 'all') {
              for (var should in filter.query.bool.should) {
                should = filter.query.bool.should[should];
                should.bool.must.push(term);
              }
            }
            else {
              filter.query.bool.must.push(term);
            }
          }

          $scope.baseQuery.filter = filter;

          $scope.pager.page = 0;

          $scope.updateSearch();
        };

        /**
         * Emits event when the user clicks a media.
         *
         * @param mediaElement
         */
        $scope.mediaOverviewClickMedia = function mediaOverviewClickImage(mediaElement) {
          $scope.$emit('mediaOverview.selectMedia', mediaElement);
        };

        /**
         * Handle mediaOverview.updateSearch events.
         */
        $scope.$on('mediaOverview.updateSearch', function (event) {
          $scope.updateSearch();

          event.preventDefault();
        });

        $scope.$watch('ikMediaType', function (val) {
          if (val === undefined) {
            $scope.updateSearch();
          }
          else {
            $scope.filterMediaType(val);
          }
        });
      },
      templateUrl: 'bundles/os2displayadmin/apps/ikShared/elements/mediaOverview/media-overview-directive.html?' + window.config.version
    };
  }
]);
