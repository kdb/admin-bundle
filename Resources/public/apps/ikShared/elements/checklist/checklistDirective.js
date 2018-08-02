/**
 * @file
 * Contains the checklist directive
 */

/**
 * Checklist directive.
 *
 */
angular.module('ikShared').directive('ikChecklist', [
  function () {
    'use strict';

    return {
      restrict: 'E',
      replace: false,
      scope: {
        elements: '=',
        selected: '=',
        identity: '='
      },
      link: function (scope) {
        scope.toggleElement = function toggleElement(el) {
          if (!scope.selected) {
            return;
          }

          var index = -1;

          scope.selected.forEach(function (element, ind) {
            if (element[scope.identity] === el[scope.identity]) {
              index = ind;
            }
          });

          if (index > -1) {
            scope.selected.splice(index, 1);
          }
          else {
            scope.selected.push(el);
          }
        };

        scope.elementSelected = function elementSelected(el) {
          if (!scope.selected) {
            return false;
          }

          for (var i = 0; i < scope.selected.length; i++) {
            if (scope.selected[i][scope.identity] === el[scope.identity]) {
              return true;
            }
          }

          return false;
        };
      },
      templateUrl: 'bundles/os2displayadmin/apps/ikShared/elements/checklist/checklist.html?' + window.config.version
    };
  }
]);
