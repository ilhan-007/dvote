function VotesController($scope, $http){
    var teamsUrl = "/dirigible/js-secured/DVOTE/user/team.js";
    var votesUrl = "/dirigible/js-secured/DVOTE/user/vote.js";
    
    $scope.columns = [
        {
            name: 'name',
            display: 'Team'
        }, 
        {
            name: 'leader',
            display: 'Team Leader'
        },
        {
            user: 'userInfo'
        }
    ];
    
    refreshData();
    
    function refreshData(){
        $http.get(teamsUrl)
            .success(function(data){
                $scope.items = data;
                for(var i = 0; i < data.length ; i ++){
                    if(data[i].userInfo){
                        $scope.userInfo = data[i].userInfo;
                        $scope.voted = $scope.userInfo.voted;
                    }
                }
            })
            .error(function(data){
                
            });
    }
    
    $scope.vote = function(team){
        var vote = {};
        vote.team_id = team.id;
        vote.vote_at = new Date();
        vote.voter = $scope.userInfo.loggedInUser;
        
        $http.post(votesUrl, vote)
            .success(function(){
                refreshData();
            })
            .error(function(response){
                
            });
    }
      
}