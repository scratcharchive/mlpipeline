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
function ImportPipelinesDialog(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('ImportPipelinesDialog');

	this.show=function() {show();};
	this.pipelineCount=function() {return m_pipelines.length;};
	this.pipelineObject=function(i) {return m_pipelines[i];};

	var m_label='Import pipelines';
	var m_dialog=null;
	var m_pipelines=[];
	var m_all_pipelines=[];

	var m_select=$('<select multiple=multiple size=12></select>');

	var m_container_div=$('<div />');
	//m_container_div.css({'overflow':'auto'});
	m_container_div.append('<table><tr><th>Github repo or url</th><td><input type=text spellcheck=false id=github_repo_input /></td></tr><tr><td /><td><button id=refresh_button>Refresh</button></td></tr></table>')
	//m_container_div.find('#github_repo_input').val('https://github.com/magland/ml_standard_pipelines.git');
	m_container_div.find('#github_repo_input').val('pipelines/standard.mlp');
	m_container_div.find('#refresh_button').click(refresh);
	m_container_div.append(m_select);

	O.div().append(m_container_div);

	O.div().append('<div id=buttons><button id=cancel_button>Cancel</button><button id=ok_button>OK</button></div>');
	O.div().find('#cancel_button').click(on_cancel);
	O.div().find('#ok_button').click(on_ok);
	O.div().find('#buttons').css({position:'absolute',bottom:20,left:20});

	function show() {
		var H0=Math.max($(document).height()-100,400);
		O.setSize(600,H0);
		var W=O.width();
		var H=O.height();
		var W1=W-40;
		var H1=H-30-40;

		m_container_div.find('#github_repo_input').css({width:W1-120});
		m_container_div.css({position:'absolute',left:20,top:20,width:W1,height:H1});

		m_select.css({position:'absolute',left:0,top:70,width:W1,height:H1-70});

		m_dialog=$('<div id="dialog"></div>');

		m_dialog.css('overflow','hidden');
		m_dialog.append(O.div());
		$('body').append(m_dialog);
		m_dialog.dialog({width:W+20,
		              height:H+60,
		              resizable:false,
		              modal:true,
		              title:m_label});
	}

	function get_owner_from_github_repo_url(url) {
		var list=url.split('/');
		if (list.indexOf('github.com')<0) return false;
		if (list.length<2) return false;
		return list[list.length-2];
	}
	function get_repo_from_github_repo_url(url) {
		var list=url.split('/');
		if (list.indexOf('github.com')<0) return false;
		if (list.length<2) return false;
		var repo=list[list.length-1];
		if (jsu_ends_with(repo,'.git')) {
			repo=repo.slice(0,repo.length-('.git').length);
		}
		return repo;
	}

	function get_recursive_contents_of_repo(owner,repo,branch,path,callback) {
		var url0='https://api.github.com/repos/'+owner+'/'+repo+'/contents/'+path+'?ref='+branch+'&_='+new Date().getTime(); //disable browser caching
		var ret=[];
		jsu_http_get_json(url0,{Accept:'application/vnd.github.v3+json'},function(tmp) {
			if (!tmp.success) {
				console.log (url0);
				alert('Error retrieving contents of github repo.');
				return;
			}
			var list=tmp.object;
			var dirs=[];
			for (var i in list) {
				var file0=list[i];
				if (file0.type=='dir') {
					dirs.push(file0);
				}
				else if (file0.type=='file') {
					ret.push(file0);
				}
			}
			if (dirs.length==00) {
				callback(ret);
				return;
			}
			var num_retrieved=0;
			for (var i in dirs) {
				get_recursive_contents_of_repo(owner,repo,branch,path+'/'+dirs[i].name,function(tmp2) {
					num_retrieved++;
					ret=ret.concat(tmp2);
					if (num_retrieved==dirs.length) {
						callback(ret);
					}
				});	
			}
		});
	}

	function refresh() {
		m_select.empty();
		m_all_pipelines=[];
		var github_repo_url=O.div().find('#github_repo_input').val();
		if (jsu_starts_with(github_repo_url,'https://github.com')) {
			var owner=get_owner_from_github_repo_url(github_repo_url);
			var repo=get_repo_from_github_repo_url(github_repo_url);
			if ((!owner)||(!repo)) {
				alert('Invalid github repo url: '+github_repo_url);
				return;
			}
			var branch='master';
			get_recursive_contents_of_repo(owner,repo,branch,'',function(files) {
				var mlp_files=[];
				for (var i in files) {
					var file0=files[i];
					if (jsu_ends_with(file0.name,'.mlp')) {
						mlp_files.push(file0);
					}
				}
				console.log('mlp_files:');
				console.log(mlp_files);
				download_mlp_files(mlp_files,function() {
					for (var i in mlp_files) {
						var pipelines0=mlp_files[i].pipelines||[];
						console.log('i='+i);
						console.log(pipelines0);
						for (var j in pipelines0) {
							m_all_pipelines.push(pipelines0[j]);
						}
					}
					console.log(m_all_pipelines);
					for (var i in m_all_pipelines) {
						var pipeline_name=m_all_pipelines[i].name||((m_all_pipelines[i].spec||{}).name);
						if ((pipeline_name!='test')&&(pipeline_name!='main')) {
							console.log('appending option: '+pipeline_name);
							m_select.append('<option value="'+i+'">'+pipeline_name+'</option>');
						}
					}
				});
			});
		}
		else {
			var url0=github_repo_url;
			jsu_http_get_json(url0,{},function(tmp) {
				if (!tmp.success) {
					alert('Error downloading or parsing mlp file: '+url0+' '+tmp.error);
					return;
				}
				m_all_pipelines=tmp.object.pipelines||[];
				for (var i in m_all_pipelines) {
					var pipeline_name=m_all_pipelines[i].name||((m_all_pipelines[i].spec||{}).name);
					if ((pipeline_name!='test')&&(pipeline_name!='main')) {
						console.log('appending option: '+pipeline_name);
						m_select.append('<option value="'+i+'">'+pipeline_name+'</option>');
					}
				}
			});
		}
	}

	function download_mlp_files(mlp_files,callback) {
		if (mlp_files.length==0) {
			callback();
			return;
		}
		var num_retrieved=0;
		for (var i in mlp_files) {
			download_mlp_file(mlp_files[i]);
		}
		function download_mlp_file(file0) {
			var url0=file0.download_url+'?_='+new Date().getTime(); //disable browser caching for this one
			jsu_http_get_json(url0,{},function(tmp) {
				if (!tmp.success) {
					alert('Error downloading or parsing mlp file: '+file0.download_url+' '+tmp.error);
					return;
				}
				num_retrieved++;
				file0.pipelines=tmp.object.pipelines||[];
				if (num_retrieved==mlp_files.length)
					callback();
			});
		}
	}

	function update_controls() {

	}

	function on_cancel() {
		O.emit('rejected');
		m_dialog.dialog('close');

	}
	function on_ok() {
		m_pipelines=[];
		var options=m_select.find('option');
		for (var i=0; i<options.length; i++) {
			if ($(options[i]).is(':selected')) {
				m_pipelines.push(m_all_pipelines[$(options[i]).val()]);
			}
		}
		O.emit('accepted');
		m_dialog.dialog('close');
	}

	refresh();
}