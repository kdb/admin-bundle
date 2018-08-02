/**
 * @file
 * Contains the channel factory.
 */

/**
 * Koba factory.
 */
angular.module('ikShared').factory('kobaFactory', ['$http', '$q',
  function ($http, $q) {
    'use strict';

    var factory = {};

    /**
     * Get available resources.
     * @returns {*}
     */
    factory.getResources = function getResources() {
      var defer = $q.defer();

      $http.get('/api/koba/resources')
        .success(function (data) {
          defer.resolve(data);
        })
        .error(function (data, status) {
          defer.reject(status);
        });

      return defer.promise;
    };

    /**
     * Get Bookings for resource for interval between from and to.
     *
     * @param resourceMail
     *   Resource mail.
     * @param from
     *   Unix timestamp
     * @param to
     *   Unix timestamp
     * @returns {*}
     */
    factory.getBookingsForResource = function getBookingsForResource(resourceMail, from, to) {
      var defer = $q.defer();

      $http.get('/api/koba/resources/' + resourceMail + '/bookings/from/' + from + '/to/' + to)
        .success(function (data) {
          defer.resolve(data);
        })
        .error(function (data, status) {
          defer.reject(status);
        });

      return defer.promise;
    };

    return factory;
  }
]);
