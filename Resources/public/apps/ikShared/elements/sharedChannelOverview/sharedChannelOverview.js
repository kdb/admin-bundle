/**
 * @file
 * Contains the channel sharing overview controller.
 */

/**
 * Directive to show the Channel Sharing overview.
 */
angular.module('ikShared').directive('sharedChannelOverview', ['sharedChannelFactory', 'userService', '$timeout', 'busService',
  function(sharedChannelFactory, userService, $timeout, busService) {
    'use strict';

    return {
      restrict: 'E',
      scope: {
        ikSelectedChannels: '=',
        ikOverlay: '@',
        ikSingleSlide: '='
      },
      link: function(scope) {
        scope.index = {};
        scope.loading = false;
        scope.pickIndexDialog = false;

        scope.displaySharingOption = window.config.sharingService.enabled;
        scope.sharingIndexes = [];
        sharedChannelFactory.getSharingIndexes().then(function(data) {
          scope.sharingIndexes = data;
        });

        scope.sort = { "created_at": "desc" };

        scope.currentUser = userService.getCurrentUser();

        // Get filter selection "all/mine" from localStorage.
        scope.showFromUser = localStorage.getItem('overview.shared_channel.search_filter_default') ?
          localStorage.getItem('overview.shared_channel.search_filter_default') :
          'all';

        // Default pager values.
        scope.pager = {
          "size": 6,
          "page": 0
        };
        scope.hits = 0;

        // Channels to display.
        scope.channels = [];

        // Setup default search options.
        var search = {
          "fields": 'title',
          "text": '',
          "filter": {
            "bool": {
              "must": {
              }
            }
          },
          "sort": {
            "created_at" : {
              "order": "desc"
            }
          },
          'pager': scope.pager
        };

        /**
         * Updates the channels array by send a search request.
         */
        scope.updateSearch = function updateSearch() {
          // Get search text from scope.
          search.text = scope.search_text;

          if (angular.isUndefined(scope.index.index)) {
            busService.$emit('log.info', {
              'msg': 'Du skal vælge et indeks først.',
              'timeout': 3000
            });
            return;
          }

          scope.loading = true;
          sharedChannelFactory.searchChannels(search, scope.index.index).then(
            function success(data) {
              scope.loading = false;
              scope.hits = data.hits;
              scope.channels = data.results;
            },
            function error(reason) {
              busService.$emit('log.error', {
                'cause': reason,
                'msg': 'Hentning af søgeresultater fejlede.'
              });
              scope.loading = false;
            }
          );
        };

        /**
         * Update search result on channel deletion.
         */
        scope.$on('channel-deleted', function() {
          scope.updateSearch();
        });

        /**
         * Returns true if channel is in selected channels array.
         *
         * @param channel
         * @returns {boolean}
         */
        scope.channelSelected = function channelSelected(channel) {
          if (!scope.ikSelectedChannels) {
            return false;
          }

          var res = false;

          scope.ikSelectedChannels.forEach(function(element) {
            if (element.unique_id == channel.unique_id) {
              res = true;
            }
          });

          return res;
        };

        /**
         * Emits the channelSharingOverview.clickChannel event.
         *
         * @param channel
         * @param index
         */
        scope.clickSharedChannel = function clickSharedChannel(channel, index) {
          scope.$emit('channelSharingOverview.clickSharedChannel', channel, index);
        };

        /**
         * Change which index is selected.
         * @param index
         */
        scope.setIndex = function setIndex(index) {
          scope.index = index;
          scope.pickIndexDialog = false;

          scope.updateSearch();
        };

        /**
         * Changes if all slides are shown or only slides belonging to current user
         *
         * @param user
         *   This should either be 'mine' or 'all'.
         */
        scope.setUser = function setUser(user) {
          // Save selection in localStorage.
          localStorage.setItem('overview.shared_channel.search_filter_default', user);

          if (scope.showFromUser !== user) {
            scope.showFromUser = user;

            scope.updateSearch();
          }
        };

        /**
         * Updates the search filter based on current orientation and user
         */
        scope.setSearchFilters = function setSearchFilters() {
          // Update orientation for the search.
          delete search.filter;

          if(scope.showFromUser !== 'all') {
            search.filter = {
              "bool": {
                "must": []
              }
            }
          }

          if (scope.showFromUser !== 'all') {
            var term = {};
            term.term = {user : scope.currentUser.id};
            search.filter.bool.must.push(term);
          }

          scope.updateSearch();
        };

        /**
         * Changes the sort order and updated the channels.
         *
         * @param sort_field
         *   Field to sort on.
         * @param sort_order
         *   The order to sort in 'desc' or 'asc'.
         */
        scope.setSort = function setSort(sort_field, sort_order) {
          // Only update search if sort have changed.
          if (scope.sort[sort_field] === undefined || scope.sort[sort_field] !== sort_order) {
            // Update the store sort order.
            scope.sort = { };
            scope.sort[sort_field] = sort_order;

            // Update the search variable.
            search.sort = { };
            search.sort[sort_field] = {
              "order": sort_order
            };

            scope.updateSearch();
          }
        };
      },
      templateUrl: 'bundles/os2displayadmin/apps/ikShared/elements/sharedChannelOverview/shared-channel-overview.html?' + window.config.version
    };
  }
]);
