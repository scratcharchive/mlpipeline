function MainWindow(O,options) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('MainWindow');

	if (!options) options={};

	this.loadFromBrowserStorage=function(doc_name,promptsave,callback) {load_from_browser_storage(doc_name,promptsave,callback);};
	this.loadFromConfigUrl=function(config_url,promptsave,callback) {load_from_config_url(config_url,promptsave,callback);};
	//this.loadFromDefaultStorageIfPresent=function() {load_from_default_storage_if_present();};
	this.loadFromFile=function() {load_from_file();};
	this.loadFromGoogleDrive=function() {load_from_google_drive();};
	this.loadFromDocumentObject=function(obj) {load_from_document_object(obj);};
	this.setDocumentName=function(name) {setDocumentName(name);};
	this.setDocumentOwner=function(owner) {setDocumentOwner(owner);};
	this.documentName=function() {return m_document.documentName();}; 
	this.changesHaveBeenSaved=function() {return changesHaveBeenSaved();};
	this.setProcessingServerName=function(name) {m_document.setProcessingServerName(name);};
	this.loadFromProcessingServer=function(userid,filename,promptsave,callback) {load_from_processing_server(userid,filename,promptsave,callback);};
	this.loadFromDocStor=function(opts,callback) {load_from_docstor(opts,callback);};
	this.login=function(opts,callback) {login(opts,callback);};
	this.setLoadingMessage=function(msg) {set_loading_message(msg);};
	this.kuleleClient=function() {return m_kulele_client;};
	this.registerPlugin=function(info) {m_main_menu.registerPlugin(info);}; 
	this.findPrvByName=function(name) {return findPrvByName(name);};
	this.registerViewPlugin=function(VP) {m_input_file_widget.registerViewPlugin(VP); m_output_file_widget.registerViewPlugin(VP);};
	this.setDocStorClient=function(DSC) {m_docstor_client=DSC;};
	this.docStorClient=function() {return m_docstor_client;};

	var m_processing_server_document_info={};

	// Set up the kulele client
	var m_kulele_client=new KuleleClient();
	JSQ.connect(m_kulele_client,'login_info_changed',O,on_kulele_client_login_info_changed);

	var m_docstor_client=null;
	var m_is_docstor_document=false;

	var processor_manager=new ProcessorManager();
	m_kulele_client.setProcessorManager(processor_manager);
    //m_kulele_client.login('anonymous',function() {});

    var m_document=new MLPDocument();
    m_document.inputFileManager().setKuleleClient(m_kulele_client);
    m_document.outputFileManager().setKuleleClient(m_kulele_client);
    m_document.setDocumentName('default.mlp');

    JSQ.connect(m_document,'processing_server_name_changed',O,on_processing_server_name_changed);

    var m_edit_pipeline_widget=new EditMLPipelineWidget(0,processor_manager);
    //var m_view_list_widget=new ViewListWidget(0,pipeline0.prvListManager());
    
    var pipeline_list_manager=m_document.pipelineListManager();
    var m_pipeline_list_widget=new MLPipelineListWidget(0,pipeline_list_manager);
    var m_job_manager=new JobManager();
    m_job_manager.setDocument(m_document);
    m_job_manager.setKuleleClient(m_kulele_client);
    m_job_manager.setProcessorManager(processor_manager);
    m_document.setJobManager(m_job_manager);

    m_edit_pipeline_widget.setJobManager(m_job_manager);

    var input_file_manager=m_document.inputFileManager();
    var m_input_file_widget=new PrvListWidget(0,input_file_manager);
    m_input_file_widget.setLabel1('Input files');
    m_input_file_widget.setUploadsAllowed(true);
    m_input_file_widget.setKuleleClient(m_kulele_client);
    JSQ.connect(m_input_file_widget,'open_banjoview',O,function(sender,args) {open_banjoview(args.prvrec);});
    JSQ.connect(m_input_file_widget,'view_text_file',O,function(sender,args) {view_text_file(args.name,args.prvrec);});
    JSQ.connect(m_input_file_widget,'download-s3-file-to-processing-server',O,function(sender,args) {download_s3_file_to_processing_server(args);});

    var output_file_manager=m_document.outputFileManager();
    var m_output_file_widget=new PrvListWidget(0,output_file_manager);
    m_output_file_widget.setRemoveAllowed(false);
    m_output_file_widget.setLabel1('Output files');
    JSQ.connect(m_output_file_widget,'open_banjoview',O,function(sender,args) {open_banjoview(args.prvrec);});
    JSQ.connect(m_output_file_widget,'view_text_file',O,function(sender,args) {view_text_file(args.name,args.prvrec);});
    JSQ.connect(m_output_file_widget,'download-s3-file-to-processing-server',O,function(sender,args) {download_s3_file_to_processing_server(args);});

    JSQ.connect(m_edit_pipeline_widget,'start_job',O,function(sender,args) {start_job(args.step,m_pipeline_list_widget.currentPipeline().name());});;
    JSQ.connect(m_edit_pipeline_widget,'stop_job',O,function(sender,args) {stop_job(args.job);});;

    // Create the main pipeline
    var main_pipeline=new MLPipeline();
    main_pipeline.setName('main');
    pipeline_list_manager.addPipeline(main_pipeline);
    m_pipeline_list_widget.setCurrentPipeline(main_pipeline);
    JSQ.connect(m_pipeline_list_widget,'current_pipeline_changed',O,on_current_pipeline_changed);

    JSQ.connect(m_pipeline_list_widget,'current_pipeline_changed',O,update_output_files);
    JSQ.connect(m_job_manager,'job_status_changed',O,update_output_files);
    
    var m_status_bar=new StatusBar();
    m_status_bar.setJobManager(m_job_manager);
    m_status_bar.setKuleleClient(m_kulele_client);

    var m_main_menu=new MainMenu(null,options);

    O.onKeyPress(function(event) {
    	m_main_menu.handleKeyPress(event);
    });

    var m_loading_message=new LoadingMessageWidget();
    m_loading_message.setParent(O);

    m_edit_pipeline_widget.setParent(O);
    m_pipeline_list_widget.setParent(O);
    m_input_file_widget.setParent(O);
    m_output_file_widget.setParent(O);
    m_status_bar.setParent(O);
    m_main_menu.setParent(O);


    JSQ.connect(m_status_bar,'set_processing_server',O,function() {select_processing_server();});
    JSQ.connect(m_status_bar,'set_user_id',O,function() {login_using_passcode();});

    JSQ.connect(m_main_menu,'import_pipelines_from_repo',O,function() {import_pipelines_from_repo();});

    JSQ.connect(m_main_menu,'login_using_google',O,function() {login_using_google();});
    JSQ.connect(m_main_menu,'login_using_passcode',O,function() {login_using_passcode();});

    JSQ.connect(m_main_menu,'new_document',O,function() {new_document();});
    JSQ.connect(m_main_menu,'save_to_browser_storage',O,function() {save_to_browser_storage();});
    JSQ.connect(m_main_menu,'load_from_browser_storage',O,function() {load_from_browser_storage(null,null,function(tmp) {if (!tmp.success) alert(tmp.error);});});
    JSQ.connect(m_main_menu,'save_to_file',O,function() {save_to_file();});
    JSQ.connect(m_main_menu,'load_from_file',O,function() {load_from_file();});
    JSQ.connect(m_main_menu,'save_to_processing_server',O,function() {save_to_processing_server();});
    JSQ.connect(m_main_menu,'load_from_processing_server',O,function() {load_from_processing_server();});
    JSQ.connect(m_main_menu,'save_to_docstor',O,function() {save_to_docstor();});
    JSQ.connect(m_main_menu,'share_on_docstor',O,function() {share_on_docstor();});
    JSQ.connect(m_main_menu,'load_from_docstor',O,function() {load_from_docstor();});
    JSQ.connect(m_main_menu,'save_to_google_drive',O,function() {save_to_google_drive();});
    JSQ.connect(m_main_menu,'load_from_google_drive',O,function() {load_from_google_drive();});
    JSQ.connect(m_main_menu,'get_temporary_shareable_link',O,function() {get_temporary_shareable_link();});

    JSQ.connect(m_main_menu,'select_processing_server',O,function() {select_processing_server();});
    JSQ.connect(m_main_menu,'advanced_configuration',O,function() {advanced_configuration();});

	JSQ.connect(O,'sizeChanged',O,update_layout);
	function update_layout() {
		var W=O.width();
		var H=O.height();

		var W1=350;
		var W2=Math.min(500,Math.max(100,W/4));
		var Hmenu=45;
		var Hstatus=20;

		m_main_menu.setGeometry(0,0,W-0*2,Hmenu);
		//m_tab_widget.setGeometry(0,Hmenu,W,H-Hstatus-Hmenu-0);
		m_edit_pipeline_widget.setGeometry(0+W1,Hmenu,W-W1-W2,H-Hstatus-Hmenu);
		m_pipeline_list_widget.setGeometry(0,Hmenu,W1,H-Hstatus-Hmenu);
		var Ha=(H-Hstatus-Hmenu)/2;
		m_input_file_widget.setGeometry(W-W2,Hmenu,W2,Ha);
		m_output_file_widget.setGeometry(W-W2,Hmenu+Ha,W2,Ha);
		m_status_bar.setGeometry(0,H-Hstatus,W,Hstatus);

		m_loading_message.setGeometry(0,0,W,H);
	}

	function set_loading_message(msg) {
		if (m_loading_message.message()==msg) return;
		m_loading_message.setMessage(msg);
		var val=(m_loading_message.message()=='');
		m_status_bar.setVisible(val);
		m_main_menu.setVisible(val);
		m_edit_pipeline_widget.setVisible(val);
		m_input_file_widget.setVisible(val);
		m_output_file_widget.setVisible(val);
		m_pipeline_list_widget.setVisible(val);
		m_loading_message.setVisible(!val);
		update_layout();
	}

	function on_current_pipeline_changed() {
		var P=m_pipeline_list_widget.currentPipeline();
		m_edit_pipeline_widget.setPipeline(P||(new MLPipeline()));
	}

	function get_document_object() {
		var obj=m_document.toObject();
		return obj;
	}

	function load_from_document_object(obj) {
		m_document.fromObject(obj);
		if (pipeline_list_manager.pipelineCount()>0) {
			m_pipeline_list_widget.setCurrentPipeline(pipeline_list_manager.pipeline(0));
		}
		on_current_pipeline_changed();
		//m_kulele_client.setSubserverName(m_document.processingServerName());
		m_last_saved_document_object=m_document.toObject();
	}

	function load_from_file() {
		if (!O.changesHaveBeenSaved()) {
			if (!confirm('You may lose your unsaved changes. Continue?')) return;
		}
		var UP=new FileUploader();
		UP.uploadTextFile({},function(tmp) {
			if (!tmp.success) {
				alert('Unexpected problem: '+tmp.error);
				return;
			}
			var obj=jsu_parse_json(tmp.text);
			if (!obj) {
				alert('Error parsing json content');
				return;
			}
			load_from_document_object(obj);
			O.setDocumentName((tmp.file_name||'default.mlp'));
			O.setDocumentOwner('');
			m_status_bar.setLastAction('Loaded from file.',5000);
			m_is_docstor_document=false;
		});
	}

	function save_to_file() {
		if (!check_ok_to_save()) return;

		var default_doc_name=remove_mlp_suffix(m_document.documentName()||'default')+'.mlp';
		var obj=get_document_object();
		if (m_kulele_client.localMode()) {
			download(JSON.stringify(obj),default_doc_name);
		}
		else {
			var doc_name=prompt('Name of JSON document:',default_doc_name);
			download(JSON.stringify(obj),doc_name);
			setDocumentName(doc_name);
			m_last_saved_document_object=m_document.toObject();
			m_status_bar.setLastAction('Saved to file.',5000);
			m_is_docstor_document=false;
		}
	}

	function load_from_processing_server(userid,doc_name,promptsave,callback) {
		if (promptsave!==false) {
			if (!O.changesHaveBeenSaved()) {
				if (!confirm('You may lose your unsaved changes. Continue?')) {
					if (callback) callback({success:false});
					return;
				}
			}
		}
		if (!doc_name) {
			doc_name=prompt('Name of document in user storage of processing server:',remove_mlp_suffix(m_document.documentName()||'default')+".mlp");
		}
		if (!doc_name) {
			if (callback) callback({success:false});
			return;
		}
		set_loading_message('Loading document from user storage...');
		if (!userid) userid=m_kulele_client.userId();
		m_kulele_client.prvLocateInUserStorage(userid,doc_name,function(tmp) {
			if (!tmp.success) {
				alert('Problem: '+tmp.error);
				finalize({success:false});
				return;
			}
			if (!tmp.found) {
				alert('File not found in user storage for '+m_kulele_client.userId()+' on processing server: '+doc_name);
				finalize({success:false});
				return;
			}
			var url0=tmp.url;
			jsu_http_get_json(url0,m_kulele_client.authorizationHeaders(),function(tmp2) {
				if (!tmp2.success) {
					alert('Problem retrieving document: '+tmp2.error);
					finalize({success:false});
					return;
				}
				load_from_document_object(tmp2.object);		
				O.setDocumentName(doc_name);
				O.setDocumentOwner('');
				finalize({success:true});
				m_status_bar.setLastAction('Loaded document from processing server.',5000);
				m_is_docstor_document=false;
			});
		});
		function finalize(ret) {
			set_loading_message('');
			if (callback) callback(ret);
			callback=0;
		}
	}

	function save_to_processing_server() {
		if (!check_ok_to_save()) return;
		var doc_name=prompt('Give the document a name for future retrieval:',remove_mlp_suffix(m_document.documentName()||'default')+'.mlp');
		if (!doc_name) return;
		var obj=get_document_object();
		set_loading_message('Saving to user storage on processing server...');
		m_kulele_client.prvUploadTextToUserStorage(m_kulele_client.userId(),doc_name,JSON.stringify(obj),function(tmp) {
			set_loading_message('');
			if (!tmp.success) {
				alert('Problem uploading to user storage: '+tmp.error);
				return;
			}
			setDocumentName(doc_name);
			m_last_saved_document_object=m_document.toObject();
			m_status_bar.setLastAction('Document saved to processing server.',5000);
			m_is_docstor_document=false;
		});
	}

	function download_document_content_from_docstor(userid,doc_name,callback) {
		if (!m_docstor_client) {
			callback({success:false,error:'No docstor client set.'});
			return;
		}
		var query={owned_by:userid,filter:{"attributes.title":doc_name}};
		if (userid!=m_kulele_client.userId()) {
			query.and_shared_with=m_kulele_client.userId();
		}
		m_docstor_client.findDocuments(query,function(err,docs) {
			if (err) {
				callback({success:false,error:'Problem finding document: '+err});
				return;
			}
			if (docs.length==0) {
				callback({success:false,error:'Document not found.'});
				return;	
			}
			if (docs.length>1) {
				callback({success:false,error:'Error: more than one document with this name found.'});
				return;	
			}
			m_docstor_client.getDocument(docs[0]._id,{include_content:true},function(err,doc0) {
				if (err) {
					callback({success:false,error:'Problem getting document content: '+err});
					return;
				}
				callback({success:true,content:doc0.content});
			});
		});
	}

	function check_document_exists_on_docstor(userid,doc_name,callback) {
		if (!m_docstor_client) {
			callback({success:false,error:'No docstor client set.'});
			return;
		}
		var query={owned_by:userid,filter:{"attributes.title":doc_name}};
		if (userid!=m_kulele_client.userId()) {
			query.and_shared_with=m_kulele_client.userId();
		}
		m_docstor_client.findDocuments(query,function(err,docs) {
			if (err) {
				callback({success:false,error:'Problem finding document: '+err});
				return;
			}
			if (docs.length==0) {
				callback({success:true,exists:false});
				return;	
			}
			callback({success:true,exists:true,id:docs[0]._id,permissions:docs[0].permissions,attributes:docs[0].attributes});
		});
	}

	function load_from_docstor(opts,callback) {
		opts=opts||{};
		var promptsave=opts.promptsave;
		var title=opts.title;
		var owner=opts.owner;
		if (promptsave!==false) {
			if (!O.changesHaveBeenSaved()) {
				if (!confirm('You may lose your unsaved changes. Continue?')) {
					finalize({success:false});
					return;
				}
			}
		}
		if (!title) {
			title=prompt('Title of document:',remove_mlp_suffix(m_document.documentName()||'default')+".mlp");
		}
		if (!title) {
			finalize({success:false});
			return;
		}
		if (!owner) {
			owner=prompt('Owner of document:',m_kulele_client.userId());
		}
		if (!owner) {
			finalize({success:false});
			return;
		}

		set_loading_message('Loading document from docstor...');
		download_document_content_from_docstor(owner,title,function(tmp) {
			if (!tmp.success) {
				alert('Problem: '+tmp.error);
				finalize({success:false});
				return;
			}
			var obj=try_parse_json(tmp.content);
			if (!obj) {
				finalize({success:false,error:'Error parsing json document'});
				return;
			}
			load_from_document_object(obj);
			O.setDocumentName(title);
			O.setDocumentOwner(owner);
			finalize({success:true});
			m_status_bar.setLastAction('Loaded document from docstor.',5000);
			m_is_docstor_document=true;
		});
		function finalize(ret) {
			set_loading_message('');
			if (callback) callback(ret);
			callback=0;
		}
	}

	function overwrite_document_on_docstor(id,content,callback) {
		if (!m_docstor_client) {
			callback({success:false,error:'No docstor client set.'});
			return;
		}
		m_docstor_client.setDocument(id,{content:content},function(err) {
			if (err) {
				callback({success:false,error:'Error setting document content: '+err});
				return;
			}
			callback({success:true});
		});
	}

	function upload_document_to_docstor(user_id,doc_name,content,callback) {
		if (!m_docstor_client) {
			callback({success:false,error:'No docstor client set.'});
			return;
		}
		var tags={app:'mlpipeline',type:'mlp'};
		m_docstor_client.createDocument({owner:user_id,content:content,attributes:{title:doc_name,tags:tags}},function(err) {
			if (err) {
				callback({success:false,error:'Error uploading document: '+err});
				return;
			}
			callback({success:true});
		});	
	}

	function change_permissions_of_document_on_docstor(id,permissions,callback) {
		var user_list=[];
		var users0=permissions.users||[];
		var lookup={};
		for (var i in users0) {
			user_list.push(users0[i].id);
			lookup[users0[i].id]=JSQ.clone(users0[i]);
		}
		var str=prompt('Comma-separated list of users:',user_list.join(','));
		if (!str) {
			callback({success:false});
			return;
		}
		var list2=str.split(',');
		var users2=[];
		for (var j=0; j<list2.length; j++) {
			var user0=list2[j].trim();
			if (user0 in lookup)
				users2.push(lookup[user0]);
			else
				users2.push({id:user0,read:true,write:true});
		}
		var new_permissions=JSQ.clone(permissions);
		new_permissions.users=JSQ.clone(users2);
		m_docstor_client.setDocument(id,{permissions:new_permissions},function(err,tmp) {
			if (err) {
				callback({success:false,error:err});
				return;
			}
			callback({success:true});
		});
	}

	function share_on_docstor() {
		if (m_edit_pipeline_widget.editorIsDirty()) {
			alert('You must first save your changes to the cloud.');
			return;
		}
		if (!m_is_docstor_document) {
			alert('You must first save your changes to the cloud (*)');
			return;
		}
		set_loading_message('Checking docstor...');
		var title=m_document.documentName();
		var owner=m_document.documentOwner();
		check_document_exists_on_docstor(owner,title,function(tmp) {
			if (!tmp.success) {
				alert('Problem:: '+tmp.error);
				on_failure();
				return;
			}
			if (tmp.exists) {
				change_permissions_of_document_on_docstor(tmp.id,tmp.permissions,function(tmp2) {
					if (tmp2.success) {
						on_success();
					}
					else {
						on_failure();
					}
				});
			}
			else {
				alert('Document not found on docstor');
				on_failure();
			}
		});
		function on_failure() {
			m_status_bar.setLastAction('Did not share document docstor',5000);
			set_loading_message('');
		}
		function on_success() {
			m_status_bar.setLastAction('Document shared on docstor: '+m_document.documentName()+' '+m_document.documentOwner(),5000);
			set_loading_message('');
		}
	}

	function save_to_docstor() {
		if (!check_ok_to_save()) return;
		var title=remove_mlp_suffix(m_document.documentName()||'default')+'.mlp';
		title=prompt('Give the document a title for future retrieval:',title);
		if (!title) return;
		var owner=m_document.documentOwner()||m_kulele_client.userId();
		owner=prompt('Document owner:',owner);
		if (!owner) return;

		var obj=get_document_object();
		set_loading_message('Saving to docstor...');
		check_document_exists_on_docstor(owner,title,function(tmp) {
			if (!tmp.success) {
				alert('Problem:: '+tmp.error);
				on_failure();
				return;
			}
			if (tmp.exists) {
				if (!confirm('Document with this title/owner exists. Overwrite?')) {
					on_failure();
					return;
				}
				overwrite_document_on_docstor(tmp.id,JSON.stringify(obj),function(tmp2) {
					if (tmp2.success) {
						set_loading_message('Document saved to docstor');
					}
					else {
						alert('Problem saving to docstor: '+tmp2.error);
					}
					on_success();
				});
			}
			else {
				upload_document_to_docstor(owner,title,JSON.stringify(obj),function(tmp2) {
					if (tmp2.success) {
						set_loading_message('Document uploaded to docstor');
					}
					else {
						alert('Problem uploading to docstor: '+tmp2.error);
					}
					on_success();
				});
			}
		});
		function update_url() {
			try {
				history.pushState(null, null, '?docstor='+title+'&owner='+owner);
			}
			catch(err) {
				console.log ('Unable to update url');
			}
		}
		function on_failure() {
			m_status_bar.setLastAction('Did not save document to docstor',5000);
			set_loading_message('');
		}
		function on_success() {
			setDocumentName(title);
			setDocumentOwner(owner);
			m_last_saved_document_object=m_document.toObject();
			m_status_bar.setLastAction('Document saved to docstor: '+m_document.documentName()+' '+m_document.documentOwner(),5000);
			update_url();
			set_loading_message('');
			m_is_docstor_document=true;
		}
	}

	function save_to_browser_storage() {
		if (!check_ok_to_save()) return;
		var doc_name=prompt('Give the document a name for future retrieval (warning: browser storage is temporary):',m_document.documentName()||'default');
		if (!doc_name) return;
		var obj=get_document_object();
		var LS=new LocalStorage();
		LS.writeObject('mlpdoc--'+doc_name,obj);
		setDocumentName(doc_name);
		m_last_saved_document_object=m_document.toObject();
		m_status_bar.setLastAction('Document saved to browser storage.',5000);
		m_is_docstor_document=false;
	}

	function check_ok_to_save() {
		if (m_edit_pipeline_widget.editorIsDirty()) {
			if (confirm('Update editor prior to saving? (If you answer no the document will not be saved')) {
				m_edit_pipeline_widget.updateFromEditors();
				return true;
			}
			else
				return false;
		}
		return true;
	}

	function setDocumentName(name) {
		m_document.setDocumentName(name);
		update_document_name_in_status();
	}
	function setDocumentOwner(owner) {
		m_document.setDocumentOwner(owner);
	}

	function new_document(promptsave,callback) {
		if (promptsave!=false) {
			if (!O.changesHaveBeenSaved()) {
				if (!confirm('You may lose your unsaved changes. Continue?')) {
					if (callback) callback({success:false});
					return;
				}
			}
		}
		load_from_document_object({});
		O.setDocumentName('untitled.mlp');
		O.setDocumentOwner('');
		if (callback) callback({success:true});
		m_status_bar.setLastAction('Opened new document.',5000);
	}

	function load_from_browser_storage(doc_name,promptsave,callback) {
		if (promptsave!=false) {
			if (!O.changesHaveBeenSaved()) {
				if (!confirm('You may lose your unsaved changes. Continue?')) {
					if (callback) callback({success:false});
					return;
				}
			}
		}
		if (!doc_name) {
			doc_name=prompt('Name of document in browser storage:',m_document.documentName()||'default');
		}
		if (!doc_name) {
			if (callback) callback({success:false});
			return;
		}
		set_loading_message('Loading from browser storage...');
		setTimeout(function() {
			var LS=new LocalStorage();
			var obj=LS.readObject('mlpdoc--'+doc_name);
			if (!obj) {
				if (callback) callback({success:false,error:'Unable to load from local storage: '+doc_name});
				set_loading_message('');
				return;
			}
			load_from_document_object(obj);
			O.setDocumentName(doc_name);
			O.setDocumentOwner('');
			if (callback) callback({success:true});
			set_loading_message('');
			m_status_bar.setLastAction('Document loaded from browser storage.',5000);
			m_is_docstor_document=false;
		},10);
	}

	function save_to_google_drive() {
		if (!check_ok_to_save()) return;
		var doc_name=prompt('Give the document a name for future retrieval (warning: browser storage is temporary):',remove_mlp_suffix(m_document.documentName()||'default')+'.mlp');
		if (!doc_name) return;
		var obj=get_document_object();

		url4text(JSON.stringify(obj),function(tmp) {
			if (!tmp.success) {
				alert(tmp.error);
				return;
			}
			var dlg=new SaveToGoogleDriveDlg();
			dlg.setSourceUrl(tmp.url);
			dlg.setFileName(doc_name);
			dlg.setSiteName('This web page');
			dlg.show();	
			setDocumentName(doc_name);
			m_last_saved_document_object=m_document.toObject();
			m_is_docstor_document=false;
		});
	}

	function changesHaveBeenSaved() {
		if (m_edit_pipeline_widget.editorIsDirty()) return false;
		return (JSON.stringify(m_last_saved_document_object)==JSON.stringify(m_document.toObject()));
	}

	function load_from_google_drive() {
		if (!O.changesHaveBeenSaved()) {
			if (!confirm('You may lose your unsaved changes. Continue?')) return;
		}
		var L=new GoogleDriveFileLoader();
		L.loadTextFile({},function(tmp) {
			if (tmp.text) {
				var obj=jsu_parse_json(tmp.text);
				if (!obj) {
					console.log (tmp);
					alert('Error parsing json content.')
					return;
				}
				load_from_document_object(obj);
				O.setDocumentName(tmp.file_name||'default.mlp');
				O.setDocumentOwner('');
				m_is_docstor_document=false;
			}
			else {
				console.log (tmp);
				console.error('Error loading from google drive.');
			}
		});
	}

	function load_from_config_url(url,promptsave,callback) {
		jsu_http_get_json(url,{},function(tmp) {
			if (!tmp.success) {
				alert(tmp.error);
				if (callback) callback({success:false});
				return;
			}
			load_from_document_object(tmp.object);
			if (callback) callback({success:true});
			m_status_bar.setLastAction('Document loaded from config url.',5000);
			m_is_docstor_document=false;
		});
	}

	function get_temporary_shareable_link() {
		var obj=get_document_object();
		url4text(JSON.stringify(obj),function(tmp) {
			if (!tmp.success) {
				alert(tmp.error);
				return;
			}
			var url0='https://mlp.herokuapp.com?load='+btoa(tmp.url);
			alert(url0);
		});
	}

	function update_output_files() {
		schedule_update_output_files();
	}

	var s_update_output_files_scheduled=false;
	function schedule_update_output_files() {
		if (s_update_output_files_scheduled) return;
		s_update_output_files_scheduled=true;
		setTimeout(function() {
			s_update_output_files_scheduled=false;
			do_update_output_files();
		},2000);
	}
	function do_update_output_files() {
		output_file_manager.clearPrvRecords();
		var pipeline0=m_pipeline_list_widget.currentPipeline();
		if (!pipeline0) return;
		if (!pipeline0.isPipelineScript()) {
			for (var i=0; i<pipeline0.stepCount(); i++) {
				var step=pipeline0.step(i);
				var job=m_job_manager.findLastJobForStep(pipeline0.name(),step);
				if (job) {
					if (job.status()=='finished') {
						var output_files=job.outputFiles();
						for (var okey in output_files) {
							if (step.outputs[okey]) {
								output_file_manager.setPrvRecord(step.outputs[okey],output_files[okey]);
							}
						}
					}
				}
			}
		}
		output_file_manager.checkOnServer();
	}

	function open_banjoview(prvrec) {
		m_kulele_client.prvLocate(prvrec.prv,function(tmp) {
			if (!tmp.success) {
				alert('Problem locating file on server: '+tmp.error);
				return;
			}
			var url0='../banjoview?load='+btoa(tmp.url);
			window.open(url0,'_blank');
			m_status_bar.setLastAction('Banjoview opened in new tab.',5000);
		});
	}

	function view_text_file(name,prvrec) {
		//todo: implement m_kulele_client.prvDownloadContent, or something
		m_kulele_client.prvLocate(prvrec.prv,function(tmp) {
			if (!tmp.success) {
				alert('Problem locating file on server: '+tmp.error);
				return;
			}
			var url0=tmp.url;
			jsu_http_get_text(url0,{},function(tmp) {
				if (!tmp.success) {
					alert('Problem downloading file: '+tmp.error);
					return;
				}
				var W=new TextFileWindow();
				W.setTitle(name);
				W.setText(tmp.text);
				W.show();
			});
		});
	}

	function download_s3_file_to_processing_server(args) {
		m_ps_download_manager.start({"s3_address":args.s3_address,"sha1":args.sha1});
	}

	function start_job(step,parent_pipeline_name) {
		m_job_manager.startTopLevelJob(step,parent_pipeline_name);
		m_status_bar.setLastAction('Started job.',5000);
	}
	function stop_job(job) {
		job.stop();
	}

	function on_processing_server_name_changed() {
		m_kulele_client.setSubserverName(m_document.processingServerName());
		processor_manager.setSpec({});
		m_kulele_client.getProcessorSpec(function(tmp) {
			if (tmp.success) {
				processor_manager.setSpec(tmp.spec);
				m_status_bar.refresh();
			}
		});
		m_status_bar.refresh();
	}

	function select_processing_server() {
		var processing_server_name=prompt('Processing server name:',m_kulele_client.subserverName());
		if (processing_server_name) {
			m_document.setProcessingServerName(processing_server_name);
		}
	}

	function advanced_configuration() {
		var kulele_url=prompt('Kulele url:',m_kulele_client.kuleleUrl());
		var cordion_url=prompt('Cordion url:',m_kulele_client.cordionUrl());
		if ((kulele_url)&&(cordion_url)) {
			m_kulele_client.setKuleleUrl(kulele_url);
			m_kulele_client.setCordionUrl(cordion_url);
			m_edit_pipeline_widget.refresh();
		}
	}

	function login(opts,callback) {
		if (opts.use_last_successful) {
			m_kulele_client.loginWithLastSuccessful(function(tmp) {
				if (tmp.success) {
					callback(tmp);
					return;
				}
				prompt_login(callback);
			});
		}
	}

	function prompt_login(callback) {
		var dlg=new ChooseLoginDlg();
		JSQ.connect(dlg,'accepted',O,function() {
			var choice=dlg.choice();
			if (choice=='google') {
				login_using_google(callback);
			}
			else if (choice=='passcode') {
				login_using_passcode(callback);	
			}
			else if (choice=='anonymous') {
				callback({success:true});
			}
		});
		dlg.show();
	}

	function login_using_google(callback) {
		var dlg=new GoogleLogInDlg();
		dlg.show();	
		JSQ.connect(dlg,'accepted',O,function(sender,args) {
			m_kulele_client.login({google_id_token:args.id_token},function(tmp) {
				if (!tmp.success) {
					alert('Problem logging in: '+tmp.error);
					return;
				}
				if (callback) callback({success:true});
				/*
				if (m_docstor_client) {
					m_docstor_client.login({id_token:args.id_token},function(err0) {
						if (err0) {
							alert('Problem logging in to docstor client');
							return;
						}
					});
				}
				*/
			});
		});
	}

	function login_using_passcode(callback) {
		var passcode=prompt('Passcode:');
		if (!passcode) return;
		m_kulele_client.login({passcode:passcode},function(tmp) {
			if (!tmp.success) {
				alert('Problem logging in: '+tmp.error);
				return;
			}
			if (callback) callback({success:true});
		});
	}

	function on_kulele_client_login_info_changed() {
		if (m_docstor_client) {
			m_docstor_client.login(m_kulele_client.loginInfo(),function(err) {
				if (err) {
					console.error('Unable to log in to docstor client: '+err);
				}
			});
		}
	}

	function remove_mlp_suffix(fname) {
		var ret=fname;
		if (jsu_ends_with(ret,'.mlp')) {
			ret=ret.slice(0,ret.length-('.mlp').length);
		}
		return ret;
	}

	function import_pipelines_from_repo() {
		var dlg=new ImportPipelinesDialog();
		dlg.show();
		JSQ.connect(dlg,'accepted',O,function(sender,args) {
			for (var i=0; i<dlg.pipelineCount(); i++) {
				var pipeline_obj=dlg.pipelineObject(i);
				var pipeline0;
				if (pipeline_obj.script)
					pipeline0=new MLPipelineScript();
				else
					pipeline0=new MLPipeline();
				pipeline0.setObject(pipeline_obj);
				m_document.pipelineListManager().addPipeline(pipeline0);
			}
			m_status_bar.setLastAction(dlg.pipelineCount()+' pipelines imported.',5000);
		});
	}
	function findPrvByName(name) {
		return input_file_manager.prv(name)||output_file_manager.prv(name)||null;
	}

	function update_document_name_in_status() {
		m_status_bar.setDocumentName(m_document.documentName());
	}
	update_document_name_in_status();

	update_layout();
	
	var default_processing_node='river';
	if (!m_kulele_client.subserverName()) {
		//select_processing_server();	
		m_document.setProcessingServerName(default_processing_node);
		//m_kulele_client.setSubserverName(m_document.processingServerName());
	}

	on_current_pipeline_changed();

	var m_last_saved_document_object=m_document.toObject();
}

function LoadingMessageWidget(O) {
	O=O||this;
	JSQWidget(O);
	O.div().addClass('LoadingMessageWidget');

	this.setMessage=function(msg) {m_message=msg; refresh();};
	this.message=function() {return m_message;};

	var m_message='';

	function refresh() {
		O.div().html('<h2>'+m_message+'</h2>');
	}
}

function try_parse_json(str) {
	try {
		return JSON.parse(str);
	}
	catch(err) {
		return null;
	}
}