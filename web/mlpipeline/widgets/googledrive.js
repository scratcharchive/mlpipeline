/*
 * Copyright 2016-2017 Flatiron Institute, Simons Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function GoogleLogInDlg(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('GoogleLogInDlg');

	this.show=function() {show();};

	var m_dialog=$('<div id="dialog"></div>');
	var m_label='Sign in using Google';

	function show() {
		//$.getScript("https://apis.google.com/js/platform.js",function() {
		$.getScript("https://apis.google.com/js/api:client.js",function() {
			gapi.load('auth2,signin2',function() {
				gapi.auth2.init({
					client_id: '272128844725-rh0k50hgthnphjnkbb70s0v1efjt0pq3.apps.googleusercontent.com'
				});
				O.div().append('<div id="google-signin2"></div>');
				O.setSize(450,300);

				var W=O.width();
				var H=O.height();
				m_dialog.css('overflow','hidden');
				m_dialog.append(O.div());
				$('body').append(m_dialog);
				m_dialog.dialog({width:W+20,
				              height:H+60,
				              resizable:false,
				              modal:true,
				              title:m_label});

				gapi.signin2.render('google-signin2',{
					onsuccess:on_success,
					onfailure:on_failure
				});
				function on_success(googleUser) {
					var profile = googleUser.getBasicProfile();
					var id_token = googleUser.getAuthResponse().id_token;
					O.emit('accepted',{profile:profile,id_token:id_token});
					m_dialog.dialog('close');
				}
				function on_failure() {
					O.emit('rejected');
					m_dialog.dialog('close');
				}
				
				
				
			});
			
		});
	}	
}

function SaveToGoogleDriveDlg(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('SaveToGoogleDriveDlg');

	this.show=function() {show();};
	this.setFileName=function(fname) {m_file_name=fname;};
	this.setSourceUrl=function(url) {m_source_url=url;};
	this.setSiteName=function(name) {m_site_name=name;};

	var m_label='Save to Google Drive';
	var m_site_name='This web page';
	var m_source_url='';
	var m_file_name='';

	O.div().append('<script src="https://apis.google.com/js/platform.js" async defer></script>');
	var div0=$('<div class="g-savetodrive" />');
	O.div().append(div0);

	function show() {
		div0.attr('data-src',m_source_url);
		div0.attr('data-filename',m_file_name);
		div0.attr('data-sitename',m_site_name);

		O.setSize(450,300);
		m_dialog=$('<div id="dialog"></div>');
		var W=O.width();
		var H=O.height();
		m_dialog.css('overflow','hidden');
		m_dialog.append(O.div());
		$('body').append(m_dialog);
		m_dialog.dialog({width:W+20,
		              height:H+60,
		              resizable:false,
		              modal:true,
		              title:m_label});
	}

	function on_cancel() {
		O.emit('rejected');
		m_dialog.dialog('close');

	}
	function on_ok() {
		O.emit('accepted');
		m_dialog.dialog('close');
	}
}

function GoogleDriveFileLoader() {
	var that=this;

	this.initialize=function(callback) {initialize(callback);};
	this.loadTextFile=function(opts,callback) {loadTextFile(opts,callback);};
	
	var m_developer_key = 'AIzaSyAQU8BftXtasPk3O8u00rgf__I2Ba0JxXw'; // The Browser API key obtained from the Google API Console.
	var m_client_id = "272128844725-rh0k50hgthnphjnkbb70s0v1efjt0pq3.apps.googleusercontent.com" // The Client ID obtained from the Google API Console.
	// (the corresponding secret was gmailed on 9/9/17)
	var m_app_id = "272128844725"; // Project number from console.developers.google.com. See "Project number" under "IAM & Admin" > "Settings"
	var m_scope = ['https://www.googleapis.com/auth/drive']; // Scope to use to access user's Drive items.

	var m_picker_api_loaded = false;
	var m_oauth_token = null;

	function initialize(callback) {

		$.getScript("https://apis.google.com/js/api.js",function() {
			gapi.load('auth', {'callback': on_auth_api_load});
			function on_auth_api_load() {
				window.gapi.auth.authorize(
			      {
			        'client_id': m_client_id,
			        'scope': m_scope,
			        'immediate': false
			      },
			      function(authResult) {
			      	if (!authResult) {
			      		console.error('authResult is null');
			      		return;
			      	}
			      	if (authResult.error) {
			      		console.log (authResult);
			      		console.error('Error in auth result');
			      		return;
			      	}
			      	m_oauth_token = authResult.access_token;
			      	callback();
			      }
			    );
			}
		});
	}

	function loadTextFile(opts,callback) {
		if (!m_oauth_token) {

			that.initialize(function() {
				if (!m_oauth_token) {
					console.error('oauth token is null');
					return;		
				}
				loadTextFile(opts,callback);
			})
			return;
		}

		// Use the Google API Loader script to load the google.picker script.
		gapi.load('picker', {'callback': on_picker_load});
		function on_picker_load() {
			var view = new google.picker.View(google.picker.ViewId.DOCS);
		    //view.setMimeTypes("image/png,image/jpeg,image/jpg");
		    var picker = new google.picker.PickerBuilder()
		        .enableFeature(google.picker.Feature.NAV_HIDDEN)
		        //.enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
		        .setAppId(m_app_id)
		        .setOAuthToken(m_oauth_token)
		        .addView(view)
		        .addView(new google.picker.DocsUploadView())
		        .setDeveloperKey(m_developer_key)
		        .setCallback(picker_callback)
		        .build();
		     picker.setVisible(true);
		}	
		function picker_callback(data) {
			if (data.action == google.picker.Action.PICKED) {
				var file_id = data.docs[0].id;
				var file_name=data.docs[0].name;
				var url="https://www.googleapis.com/drive/v2/files/"+file_id+"?alt=media"
				$.ajax({url:url,beforeSend: function (xhr) {
				  xhr.setRequestHeader ("Authorization", "Bearer "+m_oauth_token);
				},success:function(tmp) {
				  callback({file_name:file_name,file_id:file_id,text:tmp});
				}});
				//alert('The user selected: ' + fileId);
			}		
		}
	}
}