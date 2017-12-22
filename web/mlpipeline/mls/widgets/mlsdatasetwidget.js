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
function MLSDatasetWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSDatasetWidget');

	this.setMLSManager=function(M) {m_manager=M;};
	this.setDatasetId=function(ds_id) {m_dataset_id=ds_id; m_top_widget.setDatasetId(ds_id); m_bottom_widget.setDatasetId(ds_id);};
	this.refresh=function() {refresh();};

	var m_manager=null;
	var m_dataset_id='';
	var m_rawbucket_client=new RawBucketClient();
	O.div().css({'overflow-y':'auto'});
	var m_files_table=new MLTableWidget();
	var m_params_table=new MLTableWidget();
	var m_description_widget=new DescriptionWidget();
	var m_top_widget=new KDDTopWidget();
	var m_bottom_widget=new KDDBottomWidget();
	m_files_table.setParent(O);
	m_params_table.setParent(O);
	m_description_widget.setParent(O);
	m_top_widget.setParent(O);
	m_bottom_widget.setParent(O);

	JSQ.connect(m_top_widget,'refresh',O,refresh);
	JSQ.connect(m_bottom_widget,'refresh',O,refresh);

	m_description_widget.onDescriptionEdited(function() {;
		var ds=get_dataset();
		if (!ds) return;
		var prop=ds.properties();
		prop.description=m_description_widget.description();
		ds.setProperties(prop);
		set_dataset(ds);
		refresh();
		
	});

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();
		var W1=Math.min(700,2*W/3);
		var Htop=40;
		var Hbottom=30;
		var H1=Math.max(400,(H-Htop-Hbottom)*2/3);

		m_top_widget.setGeometry(0,5,W,Htop);
		m_files_table.setGeometry(0,Htop,W1,H1-Htop);
		m_params_table.setGeometry(W1,Htop,W-W1,H1-Htop);
		m_description_widget.setGeometry(0,Htop+H1,W,H-Hbottom-H1-Htop);
		m_bottom_widget.setGeometry(0,H-Hbottom,W,Hbottom);
	}

	function refresh() {
		update_tables();
		m_description_widget.setDescription('');
		var ds=get_dataset();
		if (!ds) return;
		m_description_widget.setDescription('Loading...');
		m_description_widget.setDescription(ds.properties().description||'');
		update_tables();
		setTimeout(function() {
			refresh_rb_elements();	
		},100);
	}

	function get_dataset() {
		return m_manager.study().dataset(m_dataset_id);
	}
	function set_dataset(ds) {
		m_manager.study().setDataset(m_dataset_id,ds);
	}

	function update_tables() {
		m_files_table.setColumnCount(5);
		m_files_table.headerRow().cell(1).html('File');
		m_files_table.headerRow().cell(2).html('Size');
		m_files_table.headerRow().cell(3).html('Orig. Path');
		m_files_table.headerRow().cell(4).html('RB');
		
		m_files_table.clearRows();
		var ds=get_dataset();
		if (ds) {
			var keys=ds.fileNames();
			keys.sort();
			for (var i in keys) {
				var key=keys[i];
				var row=m_files_table.createRow();
				update_file_row(row,key,ds.file(key));
				m_files_table.addRow(row);	
			}
			var link=$('<a href=#>Add file</a>');
			link.click(add_file);
			var row=m_files_table.createRow();
			row.cell(1).append(link);
			m_files_table.addRow(row);	
		}

		m_params_table.setColumnCount(3);
		m_params_table.headerRow().cell(1).html('Parameter');
		m_params_table.headerRow().cell(2).html('Value');
		m_params_table.clearRows();
		var ds=get_dataset();
		if (ds) {
			var params=ds.parameters();
			var keys=Object.keys(params);
			keys.sort();
			for (var i in keys) {
				var key=keys[i];
				var row=m_params_table.createRow();
				update_param_row(row,key,params[key]);
				m_params_table.addRow(row);	
			}
			
			var add_parameter_link=$('<a href=#>Add parameter</a>');
			add_parameter_link.click(add_param);

			var upload_params_link=$('<span class=upload_button title="Upload params.json"></span>');
			upload_params_link.click(upload_params);

			var row=m_files_table.createRow();
			row.cell(0).append(upload_params_link);
			row.cell(1).append(add_parameter_link);
			m_params_table.addRow(row);	
		}
	}
	function update_param_row(row,name,val) {
		row.cell(1).append(name);

		// remove file
		var link=$('<span class=remove_button title="Remove parameter"></span>');
		link.click(function() {
			remove_parameter(name);
		});
		row.cell(0).append(link);

		var edit_link=$('<span class=edit_button></span>');
		row.cell(2).append(edit_link);
		edit_link.click(function() {
			edit_parameter(name);
		});
		row.cell(2).append('&nbsp;');
		row.cell(2).append(val);
	}
	function upload_params() {
		var UP=new FileUploader();
		UP.uploadTextFile({},function(tmp) {
			if (!tmp.success) {
				alert(tmp.error);
				return;
			}
			if (!ends_with(tmp.file_name,'.json')) {
				alert('File must have .json extension');
				return;
			}
			var obj=try_parse_json(tmp.text);
			if (!obj) {
				alert('Error parsing json');
				return;
			}
			var ds=get_dataset();
			if (!ds) {
				alert('ds is null');
				return;
			}
			ds.setParameters(obj);
			set_dataset(ds);
			refresh();
		});
	}
	function update_file_row(row,name,file) {

		var rename_file_link=$('<span class=edit_button></span>');
		rename_file_link.click(function() {
			rename_file(name);
		});
		row.cell(1).append(rename_file_link);
		row.cell(1).append(name);


		// remove file
		var link=$('<span class=remove_button title="Remove file"></span>');
		link.click(function() {
			remove_file(name);
		});
		row.cell(0).append(link);

		// upload prv
		var link=$('<span class=upload_button></span>');
		if (file.prv) {
			link.attr('title','Upload different .prv file');
		}
		else {
			link.attr('title','Upload .prv file');
		}
		link.click(function() {
			upload_prv_file(name);
		});
		row.cell(0).append(link);

		if (file.prv) {
			var download_link1=$('<span class=download2_button title="Download prv file"></span>')
			download_link1.click(function() {
				download_prv_file(name);
			});
			row.cell(0).append(download_link1);

			row.cell(2).append(format_file_size(file.prv.original_size));

			var elmt=$('<span>'+file.prv.original_path+'</span>')
			elmt.attr('title','sha1='+file.prv.original_checksum);
			row.cell(3).append(elmt);

			var rb_elmt=$('<span class=rb data-sha1="'+file.prv.original_checksum+'" data-size="'+file.prv.original_size+'" data-name="'+name+'"></span>');
			row.cell(4).append(rb_elmt);
		}
	}
	function edit_parameter(name) {
		var ds=get_dataset();
		if (!ds) return;
		var params=ds.parameters();
		var val=params[name]||'';
		var new_val=prompt('New value for parameter '+name+':',val);
		if (new_val===null) return;
		if (new_val==val) return;
		params[name]=new_val;
		ds.setParameters(params);
		set_dataset(ds);
		refresh();
	}
	function add_file() {
		var name=prompt('Name for new file:');
		if (!name) return;
		var ds=get_dataset();
		if (!ds) return;
		ds.addFile(name,{});
		set_dataset(ds);
		refresh();
		upload_prv_file(name);
	}
	function remove_file(name) {
		if (confirm('Remove this file from dataset?')) {
			var ds=get_dataset();
			if (!ds) return;
			ds.removeFile(name);
			set_dataset(ds);
			refresh();
		}
	}
	function remove_parameter(name) {
		if (confirm('Remove this parameter?')) {
			var ds=get_dataset();
			if (!ds) return;
			ds.removeParameter(name);
			set_dataset(ds);
			refresh();
		}
	}
	function rename_file(name) {
		var new_name=prompt('New name for file:',name);
		if (!new_name) return;
		if (new_name==name) return;
		var ds=get_dataset();
		if (!ds) return;
		var file0=ds.file(name);
		ds.removeFile(name);
		ds.setFile(name,file0);
		set_dataset(ds);
		refresh();
	}
	function upload_prv_file(name) {
		var UP=new FileUploader();
		UP.uploadTextFile({},function(tmp) {
			if (!tmp.success) {
				alert(tmp.error);
				return;
			}
			if (ends_with(tmp.file_name,'.prv')) {
				var prv=try_parse_json(tmp.text);
				if (!prv) {
					alert('Error parsing JSON in prv file.');
					return;
				}
				if (!prv.original_checksum) {
					alert('Invalid prv file. Field not found: original_checksum.');
					return;
				}
				var ds=get_dataset();
				if (!ds) return;
				ds.setFile(name,{prv:prv});
				set_dataset(ds);
				refresh();
			}
			else {
				if (confirm('This is not a .prv file. Would you like to upload it in exchange for a .prv file?')) {
					var expiration=Date.now()+1000*60*5;
					var url='https://river.simonsfoundation.org/web/upload?max_size_bytes='+tmp.text.length+'&identity=mls&expiration='+expiration+'&priority=1';
					window.open(url,'_blank');
				}
			}
		});
	}
	function download_prv_file(name) {
		var ds=get_dataset();
		if (!ds) return;
		var file0=ds.file(name);
		var prv=file0.prv||{};
		var json=JSON.stringify(prv,null,4);
    	download(json,name+'.prv');
	}
	function download_original_file(name) {
		var ds=get_dataset();
		if (!ds) return;
		var file0=ds.file(name);
		var prv=file0.prv||{};
		var sha1=prv.original_checksum||'';
		var size=prv.original_size||0;
		m_rawbucket_client.stat(sha1,size,function(err,stat0) {
			if (err) {
				alert(err);
				return;
			}
			if (!stat0.found) {
				alert('Unexpected: not found on server.');
				return;
			}
			var file_name=get_file_name_from_path(prv.original_path||'');
			var url=stat0.url;
			var aaa=url.indexOf('?');
			if (aaa>=0) {
				url=url.slice(0,aaa)+'/'+file_name+'?'+url.slice(aaa+1);
			}
			else {
				url=url+'/'+file_name;
			}
			window.open(url,'_blank');
		});
	}
	function get_file_name_from_path(path) {
		var aaa=path.lastIndexOf('/');
		if (aaa>=0) return path.slice(aaa+1);
		else return path;
	}
	function refresh_rb_elements() {
		var elmts=O.div().find('.rb');
		for (var i=0; i<elmts.length; i++) {
			refresh_rb_element($(elmts[i]));
		}
		function refresh_rb_element(elmt) {
			elmt.html('Checking...');
			elmt.attr('title','');
			elmt.attr('class','rb unknown');
			var sha1=elmt.attr('data-sha1');
			var size=elmt.attr('data-size');
			var name=elmt.attr('data-name');
			m_rawbucket_client.stat(sha1,size,function(err,stat0) {
				if (err) {
					elmt.html('Error checking');
					elmt.attr('title',err);
					elmt.attr('class','rb unknown');
					return;
				}
				if (!stat0.found) {
					elmt.html('Not found');
					elmt.attr('title','Not found on the rawbucket server.');
					elmt.attr('class','rb no');
					return;
				}
				elmt.html('');
				elmt.attr('title','This file was found on the rawbucket server.');
				elmt.attr('class','rb yes');
				var download_link2=create_original_download_file_link(name);
				elmt.append(download_link2);
				elmt.append('&nbsp;Found');
			});
		}
		m_top_widget.refresh();
		m_bottom_widget.refresh();
	}
	function create_original_download_file_link(name) {
		var ret=$('<span class=download_button title="Download original file from the rawbucket server"></span>');
		ret.click(function() {
			download_original_file(name);
		});
		return ret;
	}

	JSQ.connect(m_bottom_widget,'download_params_file',O,download_params_file);
	function download_params_file() {
		var ds=get_dataset();
		if (!ds) return;
		var params=ds.parameters();
		download(JSON.stringify(params,null,4),m_dataset_id+'_params.json');
	}

	JSQ.connect(m_bottom_widget,'download_json_file',O,download_json_file);
	function download_json_file() {
		var ds=get_dataset();
		if (!ds) return;
		var obj=ds.object();
		download(JSON.stringify(obj,null,4),m_dataset_id+'.json');
	}

	function format_file_size(size_bytes) {
	    var a=1024;
	    var aa=a*a;
	    var aaa=a*a*a;
	    if (size_bytes>aaa) {
	      return Math.floor(size_bytes/aaa)+' GB';
	    }
	    else if (size_bytes>aaa) {
	      return Math.floor(size_bytes/(aaa/10))/10+' GB';  
	    }
	    else if (size_bytes>aa) {
	      return Math.floor(size_bytes/aa)+' MB';
	    }
	    else if (size_bytes>aa) {
	      return Math.floor(size_bytes/(aa/10))/10+' MB';  
	    }
	    else if (size_bytes>10*a) {
	      return Math.floor(size_bytes/a)+' KB';
	    }
	    else if (size_bytes>a) {
	      return Math.floor(size_bytes/(a/10))/10+' KB';  
	    }
	    else {
	      return size_bytes+' bytes';
	    }
	}
	function add_param() {
		var name=prompt('Parameter name:');
		if (!name) return;
		var ds=get_dataset();
		if (!ds) return;
		var params=ds.parameters();
		params[name]='';
		ds.setParameters(params);
		set_dataset(ds);
		refresh();
		edit_parameter(name);
	}

	function try_parse_json(str) {
		try {
			return JSON.parse(str);
		}
		catch(err) {
			return null;
		}
	}

	function ends_with(str,str2) {
		return (String(str).slice(str.length-str2.length)==str2);
	}

	update_layout();
}

function DescriptionWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('DescriptionWidget');

	this.description=function() {return description();};
	this.setDescription=function(descr) {setDescription(descr);};
	this.onDescriptionEdited=function(handler) {JSQ.connect(O,'description-edited',O,handler);};

	var m_top_bar=$('<div><span style="font-weight:bold">Description</span> <button id=edit_button>Edit</button></div>');
	var m_textarea=$('<textarea readonly=readonly></textarea>');
	O.div().append(m_top_bar);
	O.div().append(m_textarea);

	m_top_bar.find('#edit_button').click(edit_description);
	
	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();
		var bar_height=25;
		
		m_top_bar.css({position:'absolute',left:0,top:0,width:W,height:bar_height});
		m_textarea.css({position:'absolute',left:0,top:bar_height,width:W-15,height:H-bar_height-15});
	}

	function edit_description() {
		var dlg=new EditTextDlg();
		dlg.setLabel('Edit description');
		JSQ.connect(dlg,'accepted',O,function() {
			setDescription(dlg.text());
			O.emit('description-edited');
		});
		dlg.show();
	}

	function description() {
		return m_textarea.val();
	}

	function setDescription(descr) {
		m_textarea.val(descr);
	}

	update_layout();
}

function KDDTopWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('KDDTopWidget');

	this.setDatasetId=function(ds_id) {m_dataset_id=ds_id;};
	this.refresh=function() {refresh();};

	var m_dataset_id='';
	var m_content=$('<div><a href=# id=refresh_link title="Click to refresh this dataset"><span id=title class=title></span></a></div>');
	O.div().append(m_content);

	m_content.find('#refresh_link').click(function() {
		O.emit('refresh');
	});

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();
		
		m_content.css({position:'absolute',left:0,top:0,width:W,height:H});
	}

	function refresh() {
		m_content.find('#title').html(m_dataset_id);
	}

	update_layout();
}

function KDDBottomWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('KDDBottomWidget');

	this.setDatasetId=function(ds_id) {m_dataset_id=ds_id;};
	this.refresh=function() {refresh();};

	var download_params_link=$('<a href=#><span class=dataset_id></span>_params.json</a>');
	download_params_link.attr('title','Download parameters as JSON file');
	download_params_link.click(function() {O.emit('download_params_file');});

	var download_json_link=$('<a href=#><span class=dataset_id></span>.json</a>');
	download_json_link.attr('title','Download dataset as JSON file');
	download_json_link.click(function() {O.emit('download_json_file');});

	var m_dataset_id='';
	var m_content=$('<div></div>');
	var m_manager=null;
	m_content.append(download_params_link);
	m_content.append('&nbsp;|&nbsp;');
	m_content.append(download_json_link);

	O.div().append(m_content);

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();
		
		m_content.css({position:'absolute',left:0,top:0,width:W,height:H});
	}

	function refresh() {
		m_content.find('.dataset_id').html(m_dataset_id);
	}

	update_layout();
}