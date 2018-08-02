/**
 * @file
 * Contains directives for media upload.
 */

/**
 * Media Upload Directive.
 *
 * Emits the mediaUpload.uploadSuccess event when upload i successful.
 *
 * Emits the 'mediaUpload.uploadComplete' event for a parent controller to catch.
 *   Catch this event to handle when the upload is complete.
 */
angular.module('ikShared').directive('ikMediaUpload', ['busService', 'userService',
  function (busService, userService) {
    'use strict';

    return {
      restrict: 'E',
      scope: {
        ikUploadType: '@',
        queueLimit: '='
      },
      controller: function ($scope, FileUploader) {
        $scope.currentStep = 1;
        $scope.uploadComplete = false;
        $scope.uploadErrors = false;
        $scope.uploadInProgress = false;
        $scope.uploadErrorText = '';
        $scope.selectedGroups = [];

        // Get current user groups.
        var cleanupGetCurrentUserGroups = busService.$on('mediaUpdateDirective.getCurrentUserGroups', function (event, groups) {
          $scope.userGroups = groups;
        });
        userService.getCurrentUserGroups('mediaUpdateDirective.getCurrentUserGroups');

        var acceptedVideotypes = ['mp4', 'x-msvideo', 'x-ms-wmv', 'quicktime', 'mpeg', 'mpg', 'x-matroska', 'ogg', 'webm'];
        var acceptedImagetypes = ['jpg','png','jpeg','bmp','gif'];

        // Set accepted media types.
        var acceptedMediatypes = '';
        if ($scope.ikUploadType === 'image' || $scope.ikUploadType === 'logo') {
          acceptedMediatypes = acceptedImagetypes;
        } else if ($scope.ikUploadType === 'video') {
          acceptedMediatypes = acceptedVideotypes;
        } else {
          acceptedMediatypes = acceptedVideotypes.concat(acceptedImagetypes);
        }

        var acceptedMediaTypesText = acceptedMediatypes.reduce(function (previous, value) {
          if (!previous) {
            return value;
          }
          else {
            return previous + ", " + value
          }
        });

        // Create an uploader
        $scope.uploader = new FileUploader({
          url: '/api/media',
          queueLimit: $scope.queueLimit ? $scope.queueLimit : 1,
          filters: [{
            name: 'mediaFilter',
            fn: function (item /*{File|FileLikeObject}*/) {
              var type = item.type.slice(item.type.lastIndexOf('/') + 1);

              var accepted = acceptedMediatypes.indexOf(type) !== -1;

              if (!accepted) {
                $scope.uploadErrorText = item.type + " er ikke en accepteret medietype. Tilladte typer er: " + acceptedMediaTypesText;
              }

              return accepted;
            }
          }]
        });

        /**
         * Calls the hidden select files button.
         */
        $scope.selectFiles = function () {
          angular.element(document.querySelector('#select-files')).click();
        };

        /**
         * Clear the uploader queue.
         */
        $scope.clearQueue = function () {
          $scope.uploader.clearQueue();
          $scope.uploadComplete = false;
          $scope.uploadErrors = false;
          $scope.currentStep = 1;
          $scope.uploadErrorText = '';
        };

        /**
         * Remove item from the uploader queue.
         * @param item
         */
        $scope.removeItem = function (item) {
          item.remove();
          if ($scope.uploader.queue.length <= 0) {
            $scope.currentStep = 1;
            $scope.uploadComplete = false;
            $scope.uploadErrors = false;
          }
        };

        $scope.upload = function upload() {
          $scope.uploadInProgress = true;

          // Get group ids.
          var groupIds = [];
          for (var group in $scope.selectedGroups) {
            group = $scope.selectedGroups[group];
            groupIds.push(group.id);
          }

          // Set groups for each item.
          for (var item in $scope.uploader.queue) {
            item = $scope.uploader.queue[item];
            item.formData[0].groups = JSON.stringify(groupIds);
          }

          $scope.uploader.uploadAll();
        };

        /**
         * Checks whether the item is an image.
         */
        $scope.isImage = function (item) {
          var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1);
          return acceptedImagetypes.indexOf(type) !== -1;
        };

        /**
         * Returns the uploader progress.
         * NB! THIS IS A HACK!
         *
         * @returns {*}
         */
        $scope.getProgress = function () {
          if (!$scope.uploader.progress) {
            return;
          }

          if ($scope.uploadInProgress && $scope.uploader.progress > 5) {
            return $scope.uploader.progress - 5;
          } else {
            return $scope.uploader.progress;
          }
        };

        /**
         * After adding a file to the upload queue, add an empty title to the file item.
         */
        $scope.uploader.onAfterAddingFile = function (item) {
          item.formData = [
            {
              "title": "",
              "logo": false
            }
          ];

          if ($scope.ikUploadType === 'logo') {
            item.formData[0].logo = true;
          }
        };

        /**
         * After adding all files, increase current step.
         */
        $scope.uploader.onAfterAddingAll = function () {
          $scope.currentStep++;
        };

        /**
         * If an error occurs.
         * @param item
         * @param response
         * @param status
         */
        $scope.uploader.onErrorItem = function (item, response, status) {
          $scope.uploadErrors = true;
          $scope.uploadInProgress = false;

          $scope.clearQueue();

          $scope.uploadErrorText = "Der skete en fejl under upload af filer (fejlkode: " + status + ")."
        };

        /**
         * When all uploads are complete.
         */
        $scope.uploader.onCompleteAll = function () {
          $scope.uploadComplete = true;
          $scope.uploadInProgress = false;
        };

        /**
         * When an item has been uploaded successfully.
         * @param item
         * @param response
         */
        $scope.uploader.onSuccessItem = function (item, response) {
          $scope.$emit('mediaUpload.uploadSuccess', {
            image: item,
            id: response[0],
            queue: $scope.uploader.queue
          });
        };

        $scope.hideError = function hideError() {
          $scope.uploadErrorText = false;
        };

        /**
         * onDestroy.
         */
        $scope.$on('$destory', function () {
          cleanupGetCurrentUserGroups();
        });
      },
      templateUrl: 'bundles/os2displayadmin/apps/ikShared/elements/mediaUpload/media-upload-directive.html?' + window.config.version
    };
  }
]);
