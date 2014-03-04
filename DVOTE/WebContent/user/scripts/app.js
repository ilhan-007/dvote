var fileApp = angular.module('fileApp', [
  'ngRoute',
  'listControllers',
  'listServices'
]);

fileApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
    when('/', {
      templateUrl: 'templates/listView.html',
      controller: 'ListCtrl'
    }).
    otherwise({
      redirectTo: '/'
    });
  }
]);

var listControllers = angular.module('listControllers', []);


listControllers.controller('AllTeams', ['$scope', '$timeout', 'Teams', '$http',
  function($scope, $timeout, Teams, $http) {
      
    // setInterval(function() {
    //   document.getElementById("ping-iframe").src = "pong.html";
    // }, 180000);
    
    $scope.panelTitle = "DCODE Teams";
    (function tick() {
      Teams.query({}, function(data) {
        $scope.items = data;
        $scope.timeout = $timeout(tick, 10000);
      });
    })();
    $scope.getColumnData = function() {
      return [{
        name: 'id',
        display: '#'
      }, {
        name: 'name',
        display: 'Team'
      }, {
        name: 'leader',
        display: 'Team Leader'
      },
      {
        user: 'loggedInUser'
      }];
    }
    var url = "/dirigible/js-secured/DVOTE/user/vote.js"
    
     $scope.vote(entry){
				$http.post(url, entry)
				.success(function(){
					refreshData();
				})
				.error(function(response){
				});
	}
    
    function refreshData(){
        
    }
  }
]);

listControllers.controller('TableCtrl', ['$scope', '$routeParams', '$timeout',
  function($scope, $routeParams, $timeout) {
    $scope.columns = $scope.getColumnData();
  }
]);


listControllers.controller('ListCtrl', ['$scope',
  function($scope) {
    $scope.sth = true;
  }
]);


var listServices = angular.module('listServices', ['ngResource']);

listServices.factory('Teams', ['$resource',
  function($resource) {
    // [Maybe Teams]
    return $resource('../../../js-secured/DVOTE/user/team.js');
  }
]);
