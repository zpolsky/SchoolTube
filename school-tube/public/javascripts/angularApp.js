var app = angular.module('schoolTube', ['ui.router', 'ui.bootstrap']);

app.config(["$sceDelegateProvider", function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        "https://www.youtube.com/embed/**",
        "http://www.youtube.com/embed/**"
    ]);
}]);

// Taken from https://gist.github.com/takien/4077195
function getVideoUID(url) {
	var ID = '';
  	url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
  	if (url[2] !== undefined) {
    	ID = url[2].split(/[^0-9a-z_\-]/i);
    	ID = ID[0];
  	}
  	else {
    	ID = url;
  	}
  	var video = 'https://www.youtube.com/embed/' + ID; // + '?autoplay=1';
    return video;
}

app.controller('MainCtrl', [
'$scope',
'posts',
'playlists',
'auth',
function($scope, posts, playlists, auth){
	
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.posts = posts.posts;

	$scope.searchTag = '';

	$scope.searchPost = '';
	$scope.searchPlaylist = '';

	$scope.goToCreate = function() {
		window.location.href = '#/createPlaylist';
	}

	$scope.goToView = function() {
		window.location.href = '#/viewPlaylists';
	}

	$scope.addPost = function() {
  		if (!$scope.title || $scope.title === '') { return; }
  		if (!$scope.description || $scope.description === '') { return; }
  		if (!$scope.video || $scope.video === '') { return; }

		posts.create({
			title: $scope.title,
			description: $scope.description,
			video: getVideoUID($scope.video),
			tag: $scope.tag,
		});
  		$scope.title = '';
  		$scope.description = '';
  		$scope.video = '';
  		$scope.tag = '';

  		alert('Upload complete!');
  		window.location.href = '#/home'; // redirect back to home page after successful upload
	};

	$scope.like = function(post) {
		posts.like(post);
	};

	$scope.dislike = function(post) {
		posts.dislike(post);
	};

	$scope.profile = function(author) {
		console.log("author clicked", author);
		window.localStorage['clicked-profile'] = author;
		window.location.href = ('#/users/' + author);
	};

}]);

app.controller('mainPlaylistCtrl', [
	'$scope',
	'posts',
	'playlists',
	'auth',
	function($scope, posts, playlists, auth){
		$scope.isLoggedIn = auth.isLoggedIn;

		$scope.playlists = playlists.playlists;

		$scope.posts = posts.posts;

		$scope.search = '';
		$scope.goToCreate = function(){
			window.location.href = '#/createPlaylist';
		}

		$scope.playlist = {
	        title : "",
	        description: "",
	        posts : []
	    };
		$scope.i = 1;
		$scope.toggleVideo = function(post){
			var inPlaylist = false;
			var index = -1;
			for(var i = 0; i < $scope.playlist.posts.length; i++){
				var x = $scope.playlist.posts[i];
				if(x['title']==post['title'] && x['author'] == post['author']
					&& x['description'] == post['description']) {
					inPlaylist = true;
					index = i;
				}
			}
			if(inPlaylist){
				$scope.playlist.posts.splice(index, 1);
			}
			else{
				$scope.playlist.posts.push(post);
			}
		}
		$scope.createPlaylist = function(){
			if($scope.playlist.posts.length==0){ return; }
			if($scope.playlist.title == '' || $scope.playlist.title == undefined){ return; }
			console.log("creating playlist", $scope.playlist);
			playlists.create($scope.playlist);
			window.location.href = '#/viewPlaylists';
		}
}]);

app.controller('PlaylistCtrl', [
'$scope',
'playlists',
'playlist',
'auth',
function($scope, playlists, playlist, auth) {
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.playlist = playlist;

	$scope.currentUser = auth.currentUser; // added by me

	$scope.isAuthor = playlists.isAuthor(playlist, auth.currentUser());

	$scope.delete = function(){
		playlists.delete(playlist);
	}

}]);

app.controller('PostsCtrl', [
'$scope',
'posts',
'post',
'auth',
function($scope, posts, post, auth) {
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.post = post;

	$scope.addComment = function(){
	  if ($scope.body === '') { return; }
	  posts.addComment(post._id, {
	  	author: $scope.currentUser,
	  	body: $scope.body,
	  }).success(function(comment) {
	  	$scope.post.comments.push(comment);
	  });
	  $scope.body = '';
	};

	$scope.like = function(comment) {
		posts.likeComment(post, comment);
	};

	$scope.dislike = function(comment) {
		posts.dislikeComment(post, comment);
	}
}]);

app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};

  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
}]);

app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth) {
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.currentUser = auth.currentUser;
	$scope.logOut = auth.logOut;
}]);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  	$stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      resolve: {
      	postPromise: ['posts', function(posts) {
      		return posts.getAll();
      	}]
      }
    })

    .state('posts', {
	  url: '/posts/{id}',
	  templateUrl: '/posts.html',
	  controller: 'PostsCtrl',
	  resolve: {
	  	post: ['$stateParams', 'posts', function($stateParams, posts) {
	  		return posts.get($stateParams.id);
	  	}]
	  }
	})

	.state('playlists', {
	  url: '/playlists/{id}',
	  templateUrl: '/playlists.html',
	  controller: 'PlaylistCtrl',
	  resolve: {
	  	playlist: ['$stateParams', 'playlists', function($stateParams, playlists) {
	  		return playlists.get($stateParams.id);
	  	}]
	  }
	})

	.state('createPlaylist', {
		url:'/createPlaylist',
		templateUrl: '/createPlaylist.html',
		controller: 'mainPlaylistCtrl',
		resolve: {
      	postPromise: ['posts', function(posts) {
      		return posts.getAll();
      	}]
      }
	})

	.state('viewPlaylists', {
	  url: '/viewPlaylists',
	  templateUrl: '/viewPlaylists.html',
	  controller: 'mainPlaylistCtrl',
	  resolve: {
	    postPromise: ['playlists', function(playlists){
	      return playlists.getAll();
	    }]
	  }
	})

	.state('upload', {
		url: '/upload',
		templateUrl: '/upload.html',
		controller: 'MainCtrl'
	})

	.state('allVideos', {
		url: '/allVideos',
		templateUrl: '/allVideos.html',
		controller: 'MainCtrl',
		resolve: {
	    	postPromise: ['posts', function(posts){
	      		return posts.getAll();
	    	}]
	  	}
	})

	.state('users', {
		url: '/users/{id}',
		templateUrl: '/users.html',
		controller: 'MainCtrl'
	})

	.state('login', {
		url: '/login',
		templateUrl: '/login.html',
		controller: 'AuthCtrl',
		onEnter: ['$state', 'auth', function($state, auth) {
			if (auth.isLoggedIn()) {
				$state.go('home');
			}
		}]
	})

	.state('register', {
		url: '/register',
		templateUrl: '/register.html',
		controller: 'AuthCtrl',
		onEnter: ['$state', 'auth', function($state, auth) {
			if (auth.isLoggedIn()) {
				$state.go('home');
			}
		}]
	});

  $urlRouterProvider.otherwise('home');
}]);

app.factory('posts', ['$http', '$window', 'auth', function($http, $window, auth) {
  var o = {
    posts: []
  };
  o.getAll = function() {
    return $http.get('/posts').success(function(data) {
      angular.copy(data, o.posts);
    });
  };

  o.create = function(post) {
  	return $http.post('/posts', post, {
  		headers: {Authorization: 'Bearer ' + auth.getToken()}
  	}).success(function(data) {
  		o.posts.push(data);
  	});
  };

  o.like = function(post) {
  	return $http.put('/posts/' + post._id + '/like', null, {
  		headers: {Authorization: 'Bearer ' + auth.getToken()}
  	}).success(function(data) {
  		post.likes += 1;
  	});
  };

  o.dislike = function(post) {
  	return $http.put('/posts/' + post._id + '/dislike', null, {
  		headers: {Authorization: 'Bearer ' + auth.getToken()}
  	}).success(function(data) {
  		post.likes -= 1;
  	});
  };

	o.get = function(id) {
	  return $http.get('/posts/' + id).then(function(res) {
	    return res.data;
	  });
	};

	o.addComment = function(id, comment) {
		return $http.post('/posts/' + id + '/comments', comment, {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		});
	};

	o.likeComment = function(post, comment) {
		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/like', null, {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		}).success(function(data) {
			comment.likes += 1;
		});
	};

	o.dislikeComment = function(post, comment) {
		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/dislike', null, {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		}).success(function(data) {
			comment.likes -= 1;
		});
	};

  return o;
}]);

app.factory('auth', ['$http', '$window', function($http, $window) {
	var auth = {};

	auth.saveToken = function(token) {
		$window.localStorage['school-tube-token'] = token;
	};

	auth.getToken = function() {
		return $window.localStorage['school-tube-token'];
	}

	auth.isLoggedIn = function() {
		var token = auth.getToken();

		if (token) {
			var payload = JSON.parse($window.atob(token.split('.')[1]));
			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUser = function() {
		if (auth.isLoggedIn()) {
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	auth.register = function(user) {
		return $http.post('/register', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	auth.logIn = function(user) {
		return $http.post('/login', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	auth.logOut = function() {
		$window.localStorage.removeItem('school-tube-token');
		window.location.href = '#/home'; // redirect back to home page after successful upload
	};
	return auth;
}]);

app.factory('playlists', ['$http', '$window', 'auth', function($http, $window, auth) {
  var a = {
    playlists: []
  };
  a.getAll = function() {
    return $http.get('/playlists').success(function(data){
      angular.copy(data, a.playlists);
    });
  };

  a.create = function(playlist) {
  	console.log('trying to save a playlist', auth.getToken());
  	return $http.post('/playlists', playlist, {
  		headers: {Authorization: 'Bearer ' + auth.getToken()}
  	}).success(function(data) {
  		a.playlists.push(data);
  	});
  };

  a.delete = function(playlist) {
  	console.log('trying to delete a playlist');
  	return $http.put('/playlists/' + playlist._id + '/delete', null, {
  		headers: {Authorization: 'Bearer ' + auth.getToken()}
  	}).success(function(data) {
  		var index = a.playlists.indexOf(data);
  		a.playlists.splice(index, 1);
  		window.location.href = '#/viewPlaylists';
  	});
  };

  a.isAuthor = function(playlist, author){
  	if(author == playlist.author){
  		return true;
  	}
  	else{
  		return false;
  	}
  }

	a.get = function(id) {
	  return $http.get('/playlists/' + id).then(function(res){
	    return res.data;
	  });
	};

  return a;
}]);


