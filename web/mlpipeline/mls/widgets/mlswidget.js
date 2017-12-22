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
function MLSWidget(O,options) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSWidget');

	if (!options) options={};

	this.setMLSManager=function(M) {setMLSManager(M); refresh();};
	this.refresh=function() {refresh();};

	var m_manager=null;

	var m_list_widget=new MLSDatasetListWidget();
	var m_dataset_widget=new MLSDatasetWidget();
	m_list_widget.setParent(O);
	m_dataset_widget.setParent(O);

	m_list_widget.onCurrentDatasetChanged(refresh_dataset);

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();

		var W1=Math.max(200,Math.floor(W/10));
		var W2=W-W1;

		hmarg=5;
		m_list_widget.setGeometry(hmarg,0,W1-hmarg*2,H);
		m_dataset_widget.setGeometry(W1+hmarg,0,W2-hmarg*2,H);
	}

	function refresh() {
		m_list_widget.refresh();
		refresh_dataset();
	}
	function refresh_dataset() {
		var ds_id=m_list_widget.currentDatasetId();
		if (!ds_id) {
			m_dataset_widget.refresh();
			return;
		}
		/*
		var ds=m_manager.study().dataset(ds_id);
		if (!ds) {
			m_dataset_widget.refresh();
			return;	
		}
		*/
		m_dataset_widget.setDatasetId(ds_id);
		m_dataset_widget.refresh();
	}

	function setMLSManager(M) {
		m_manager=M;
		m_list_widget.setMLSManager(M);
		m_dataset_widget.setMLSManager(M);
	}

	update_layout();
}

function MLSMainWindow(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSMainWindow');

	this.setDocStorClient=function(DSC) {m_docstor_client=DSC;};
	this.loadFromDocStor=function(owner,title,callback) {loadFromDocStor(owner,title,callback);};
	this.loadFromFileContent=function(path,content,callback) {loadFromFileContent(path,content,callback);};

	var m_mls_manager=new MLSManager();
	var m_docstor_client=null;
	var m_file_source=''; //e.g., docstor
	var m_file_path=''; //when m_file_source=='file_content'
	var m_docstor_info={owner:'',title:''}; //when m_file_source=='docstor'
	var m_mls_widget=new MLSWidget();
	m_mls_widget.setParent(O);
	m_mls_widget.setMLSManager(m_mls_manager);
	var m_top_widget=new MLSTopWidget();
	m_top_widget.setParent(O);
	m_top_widget.setMLSManager(m_mls_manager);

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();

		var top_height=40;

		m_top_widget.setGeometry(0,0,W,top_height);
		m_mls_widget.setGeometry(0,top_height,W,H-top_height);
	}

	function loadFromDocStor(owner,title,callback) {
		download_document_content_from_docstor(m_docstor_client,owner,title,function(err,content,doc_id) {
			if (err) {
				callback(err);
				return;
			}
			var obj=try_parse_json(content);
	        if (!obj) {
	        	console.log (content);
	            callback('Unable to parse mls file content');
	            return;
	        }
	        m_mls_manager.setMLSObject(obj);
	        m_mls_widget.refresh();
	        m_file_source='docstor';
	        m_docstor_info={owner:owner,title:title,doc_id:doc_id};
	        m_top_widget.setOriginalStudyObject(m_mls_manager.study().object());
	        callback(null);
		});
	}

	function loadFromFileContent(path,content,callback) {
		var obj=try_parse_json(window.mls_file_content);
        if (!obj) {
        	console.log (window.mls_file_content);
            callback('Unable to parse mls file content');
            return;
        }
        m_mls_manager.setMLSObject(obj);
        m_mls_widget.refresh();
        m_file_source='file_content';
        m_file_path=path;
        m_top_widget.setOriginalStudyObject(m_mls_manager.study().object());
        callback(null);
	}

	JSQ.connect(m_top_widget,'save_changes',O,save_changes);
	function save_changes() {
		var obj=m_mls_manager.study().object();
		var content=JSON.stringify(obj,null,4);
		if (m_file_source=='docstor') {
			set_document_content_to_docstor(m_docstor_client,m_docstor_info.doc_id,content,function(err) {
				if (err) {
					alert('Unable to save document: '+err);
					return;
				}
				m_top_widget.setOriginalStudyObject(obj);
			});
		}
		else if (m_file_source=='file_content') {
			download(content,'',m_file_path);
			m_top_widget.setOriginalStudyObject(obj);
		}
	}

	JSQ.connect(m_top_widget,'download_study',O,download_study);
	function download_study() {
		var obj=m_mls_manager.study().object();
		var content=JSON.stringify(obj,null,4);
		if (m_file_source=='docstor') {
			fname=m_docstor_info.title;
		}
		else {
			fname=m_file_path;
		}
		download(content,fname);
	}

	update_layout();
}

function set_document_content_to_docstor(DSC,doc_id,content,callback) {
	DSC.setDocument(doc_id,{content:content},function(err) {
		callback(err);
	});
}

function download_document_content_from_docstor(DSC,owner,title,callback) {
    var query={owned_by:owner,filter:{"attributes.title":title}};
    if (DSC.user()!=owner)
    	query.and_shared_with=DCS.user();
    DSC.findDocuments(query,function(err,docs) {
        if (err) {
            callback('Problem finding document: '+err);
            return;
        }
        if (docs.length==0) {
            callback('Document not found.');
            return; 
        }
        if (docs.length>1) {
            callback('Error: more than one document with this title and owner found.');
            return; 
        }
        DSC.getDocument(docs[0]._id,{include_content:true},function(err,doc0) {
            if (err) {
                callback('Problem getting document content: '+err);
                return;
            }
            callback(null,doc0.content,docs[0]._id);
        });
    });
}

function MLSTopWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MLSTopWidget');

	this.setOriginalStudyObject=function(obj) {m_original_study_object=JSQ.clone(obj); refresh();};
	this.setMLSManager=function(M) {setMLSManager(M);};
	this.refresh=function() {refresh();};

	var m_original_study_object={};
	var m_mls_manager=null;
	var m_content=$('<div><button id=save_changes>Save changes</button></div>');
	if (window.mlpipeline_mode!='local') {
		var link0=$('<button>Download study</button>');
		m_content.append(link0);
		link0.click(function() {console.log('aaa'); O.emit('download_study');});
	}
	O.div().append(m_content);

	m_content.find('#save_changes').click(function() {
		O.emit('save_changes');
	});

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();
		
		m_content.css({position:'absolute',left:0,top:0,width:W,height:H});
	}

	function setMLSManager(M) {
		m_mls_manager=M; 
		JSQ.connect(M.study(),'changed',O,refresh);
		refresh();
	}

	function refresh() {
		//m_content.find('#title').html(m_dataset_id);
		if (is_modified()) {
			m_content.find('#save_changes').removeAttr('disabled');
		}
		else {
			m_content.find('#save_changes').attr('disabled','disabled');	
		}
	}

	function is_modified() {
		var obj1=m_original_study_object;
		var obj2=m_mls_manager.study().object();
		return (JSON.stringify(obj1)!=JSON.stringify(obj2));
	}

	update_layout();
}