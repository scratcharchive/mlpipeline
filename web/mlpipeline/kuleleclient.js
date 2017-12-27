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
if (typeof module !== 'undefined' && module.exports) {
	//using nodejs
	exports.KuleleClient=KuleleClient;
	jsu=require(__dirname+'/jsutils/jsutils.js').jsu;
	jsu_starts_with=jsu.starts_with;
	jsu_http_post_json=jsu.http_post_json;
	jsu_http_get_json=jsu.http_get_json;
	document={
		documentURI:''
	};
	LocalStorage=require('./jsutils/localstorage.js').LocalStorage;
	sha1=require('./jsutils/3rdparty/sha1.js');
	btoa=function(str) {return new Buffer(str).toString('base64');};
	mlpLog=function() {}; //so that we don't get an exception

	JSQObject=require('./jsq/src/jsqcore/jsqobject.js').JSQObject;
	JSQ=require('./jsq/src/jsqcore/jsq.js').JSQ;

}

function KuleleClient(O) {
	O=O||this;
	JSQObject(O);

	this.setKuleleUrl=function(url) {if (m_kulele_url==url) return; m_kulele_url=url; O.emit('changed');};
	this.setCordionUrl=function(url) {if (m_cordion_url==url) return; m_cordion_url=url; O.emit('changed');};
	this.login=function(opts,callback) {login(opts,callback);};
	this.loginWithLastSuccessful=function(callback) {loginWithLastSuccessful(callback);};
	this.authorization=function() {return m_authorization;};
	this.authorizationHeaders=function() {return authorization_headers();};
	this.userId=function() {return m_authorization.userid||'';};
	this.setSubserverName=function(name) {if (m_subserver_name==name) return; m_subserver_name=name; O.emit('changed');};
	this.kuleleUrl=function() {return m_kulele_url;};
	this.cordionUrl=function() {return m_cordion_url;};
	this.subserverName=function() {return m_subserver_name;};
	this.prvLocate=function(prv,callback) {prvLocate(prv,callback);};
	this.prvLocateInUserStorage=function(userid,filename,callback) {prvLocateInUserStorage(userid,filename,callback);};
	this.prvUpload=function(file_data,callback) {prvUpload(file_data,callback);};
	this.prvUploadToUserStorage=function(userid,filename,file_data,callback) {prvUploadToUserStorage(userid,filename,file_data,callback);};
	this.prvUploadText=function(txt,callback) {prvUploadText(txt,callback);};
	this.prvUploadTextToUserStorage=function(userid,filename,txt,callback) {prvUploadTextToUserStorage(userid,filename,txt,callback);};
	this.setProcessorManager=function(PM) {m_processor_manager=PM;};
	this.processorManager=function() {return m_processor_manager;};
	this.queueJob=function(processor_name,inputs,outputs_to_return,params,opts,callback) {queueJob(processor_name,inputs,outputs_to_return,params,opts,callback);};
	this.probeJob=function(process_id,callback) {probeJob(process_id,callback);};
	this.cancelJob=function(process_id,callback) {cancelJob(process_id,callback);};
	this.downloadRawFromPrv=function(prv) {download_raw_from_prv(prv);};
	this.getProcessorSpec=function(callback) {getProcessorSpec(callback);};
	this.setLarinetServer=function(LS) {m_larinetserver=LS;}; //only set when using nodejs
	this.loginInfo=function() {return m_login_info;};
	this.setLocalMode=function(val) {m_local_mode=val;};
	this.localMode=function() {return m_local_mode;};

	var m_kulele_url='';
	var m_cordion_url='';
	var m_subserver_name='';
	var m_processor_manager=null;
	var m_authorization_jwt='';
	var m_authorization={};
	var m_larinetserver=null; //only set when using nodejs
	var m_login_info={};
	var m_local_mode=false;

	if (jsu_starts_with(document.documentURI,'http://localhost')) {
		m_kulele_url='http://localhost:5004';
    	m_cordion_url='http://localhost:5006';	
	}
	else {
		m_kulele_url='https://kulele.herokuapp.com';
    	m_cordion_url='https://cordion.herokuapp.com';	
	}

	var prv_locate_found_cache={};
	function prvLocate(prv,callback) {
	    if ((!m_subserver_name)&&(!m_local_mode)) {
	      callback({success:false,error:'subserver has not been set (prvLocate)'});
	      return;
	    }
	    if (!prv) {
	    	callback({success:false,error:'prv is null or undefined'});
	    	return;
	    };

	    var url0=m_kulele_url+'/subserver/'+m_subserver_name;
		var req={
			a:'prv-locate',
			checksum:prv.original_checksum,
			size:prv.original_size,
			fcs:prv.original_fcs
		};
		var code=url0+JSON.stringify(req);
		if (code in prv_locate_found_cache) {
			callback(prv_locate_found_cache[code]);
			return;
		}
		post_to_larinet(url0,req,function(tmp) {
			if (!tmp.success) {
				callback(tmp);
				return;
			}
			if (tmp.found)
				prv_locate_found_cache[code]=tmp;
			callback(tmp);
		});

	    /*
	    var url=m_kulele_url+'/subserver/'+m_subserver_name+'?a=prv-locate&checksum='+prv.original_checksum+'&size='+prv.original_size+'&fcs='+prv.original_fcs;   
	    if (url in prv_locate_found_cache) {
	    	callback(prv_locate_found_cache[url]);
	    	return;
	    }
	    jsu_http_get_json(url,authorization_headers(),function(tmp) {
	    	if (!tmp.success) {
	    		callback(tmp);
	    		return;
	    	}
	    	if (tmp.object.url) {
	    		tmp.object.url=tmp.object.url.split('${base}').join(m_kulele_url+'/subserver/'+m_subserver_name);
	    	}
	    	if (tmp.object.found) {
	    		prv_locate_found_cache[url]=tmp.object;
	    	}
	    	callback(tmp.object);
	    });
	    */
	}

	function prvLocateInUserStorage(userid,filename,callback) {
	    if ((!m_subserver_name)&&(!m_local_mode)) {
	      callback({success:false,error:'subserver has not been set (prvLocateInUserStorage)'});
	      return;
	    }
	    var req={
	    	a:'prv-locate',
	    	user_storage:true,
	    	userid:userid,
	    	filename:filename
	    }
	    var url0=m_kulele_url+'/subserver/'+m_subserver_name;   
	    jsu_http_post_json(url0,req,authorization_headers(),function(tmp) {
			if (!tmp.success) {
				callback({success:false,error:tmp.error});
				return;
			}
			if (tmp.object.url) {
				tmp.object.url=tmp.object.url.split('${base}').join(m_kulele_url+'/subserver/'+m_subserver_name);
			}
			var object=tmp.object;
			callback(tmp.object);	
		});
	}

	function login(opts,callback) {
		if (typeof opts == 'string') {
			opts={passcode:opts};
		}
		m_authorization_jwt='';
		O.emit('changed');
		var url0=m_cordion_url+'/api/getauth';
		var req0=opts;
		var headers0={};
		jsu_http_post_json(url0,req0,headers0,function(tmp) {
			if (!tmp.success) {
				console.log ('Problem in login: '+tmp.error);;
				callback(tmp);
				m_login_info={};
				O.emit('login_info_changed');
				return;
			}
			if (!tmp.object.success) {
				callback(tmp.object);
				m_login_info={};
				O.emit('login_info_changed');
				return;
			}
			var jwt=tmp.object.token||'';
			if (!jwt) {
				callback({success:false,error:'token is empty'});
				m_login_info={};
				O.emit('login_info_changed');
				return;
			}
			m_authorization_jwt=jwt;
			m_authorization=decode_jwt_without_verifying(jwt);
			O.emit('changed');
			var LS=new LocalStorage();
			m_login_info=JSQ.clone(opts);
			O.emit('login_info_changed');
			LS.writeObject('last-successful-login-info',{opts:opts});
			callback({success:true});
		});
	}

	function loginWithLastSuccessful(callback) {
		var LS=new LocalStorage();
		var obj=LS.readObject('last-successful-login-info');
		setTimeout(function() {
			if ((!obj)||(!obj.opts)) {
				login('anonymous',callback);
				return;
			}
			login(obj.opts,function(tmp) {
				if (!tmp.success) {
					login('anonymous',callback);
					return;
				}
				callback(tmp);
			});
		},500);
	}

	function decode_jwt_without_verifying(jwt) {
		try {
			var list=jwt.split('.');
			var json=atob((list[1]||''));
			return JSON.parse(json);
		}
		catch(err) {
			return {};
		}
	}

	function authorization_headers() {
		var headers={
			"Authorization":'Bearer '+m_authorization_jwt
		};
		return headers;
	}

	function queueJob(processor_name,inputs,outputs_to_return,params,opts_in,callback) {
		var logtxt='Queuing processor job: '+processor_name+' '+JSON.stringify(params);
		mlpLog({text:logtxt});
		var spec=m_processor_manager.processorSpec(processor_name);
		if (!spec) {
			callback({success:false,error:'Processor is not registered: '+processor_name});
			return;
		}

		var opts=JSQ.clone(opts_in);

		if (('opts' in spec)&&('cache_output' in spec.opts)) {
			opts.cache_output=spec.opts.cache_output;
		}

		/*
		if (spec.meta) {
			queue_meta_processor_job(processor_name,inputs,outputs_to_return,params,opts,callback);
			return;
		}
		*/

		var prv_inputs={};
		var kulele_url=m_kulele_url;
		var server=m_subserver_name;

		var url0=kulele_url+'/subserver/'+server;
		var resources={
				force_run:false,
				max_ram_gb:4,
				max_etime_sec:20,
				max_cputime_sec:0,
				max_cpu_pct:0
			};

		function get_resources() {
			return m_authorization.per_process||{};
		}

		var object_for_id={
			spec:spec, //will include the version
			inputs:inputs,
			outputs:outputs_to_return,
			parameters:params
		};
		var process_id=sha1(JSON.stringify(object_for_id));

		var req={
			a:'queue-process',
			processor_name:processor_name,
			inputs:inputs,
			outputs:outputs_to_return,
			parameters:params,
			opts:opts,
			process_id:process_id,
			resources:get_resources(),
			wait_msec:3000
		};
		post_to_larinet(url0,req,function(tmp) {
			callback(tmp);
		});
		/*
		jsu_http_post_json(url0,req,authorization_headers(),function(tmp) {
		  if (!tmp.success) {
		    callback({success:false,error:tmp.error});
		    return;
		  }
		  var object=tmp.object;
		  //object.success (boolean)
		  //object.process_id (string)
		  //object.complete (boolean)
		  //object.result (if complete)
		  //object.result.outputs (if complete)
		  callback(object);	
		});
		*/
	}

	function getProcessorSpec(callback) {
		var url0=m_kulele_url+'/subserver/'+m_subserver_name;
		var req={
			a:'processor-spec'
		};
		post_to_larinet(url0,req,function(tmp) {
			callback(tmp);
		});
	}

	function post_to_larinet(url0,req,callback) {
		if (m_larinetserver) {
			//when using nodejs
			var onclose=false;
			m_larinetserver(req,onclose,callback);
		}
		else {
			if (m_subserver_name) {
				jsu_http_post_json(url0,req,authorization_headers(),function(tmp) {
				  if (!tmp.success) {
				    callback({success:false,error:tmp.error});
				    return;
				  }
				  var object=tmp.object;
				  callback(object);	
				});
			}
			else {
				callback({success:false,error:'Subserver name has not been set.'});
				return;
			}
		}
	}

	function probeJob(process_id,callback) {
		/*
		if (jsu_starts_with(process_id,'meta_')) {
			if (!(process_id in m_meta_processor_jobs)) {
				callback({success:false,error:'Unable to find meta processor job: '+process_id});
				return;
			}
			m_meta_processor_jobs[process_id].probeJob(callback);
			return;
		}
		*/
		var kulele_url=m_kulele_url;
		var server=m_subserver_name;
		/*
		if (!m_subserver_name) {
			callback({success:false,error:'Subserver name has not been set.'});
			return;
		}
		*/

		var url0=kulele_url+'/subserver/'+server;
		var req={
			a:'probe-process',
			process_id:process_id
		};
		post_to_larinet(url0,req,function(tmp) {
			callback(tmp);
		});
		/*
		jsu_http_post_json(url0,req,authorization_headers(),function(tmp) {
		  if (!tmp.success) {
		    callback({success:false,error:tmp.error});
		    return;
		  }
		  callback(tmp.object);
		});
		*/
	}

	function cancelJob(process_id,callback) {
		/*
		if (jsu_starts_with(process_id,'meta_')) {
			if (!(process_id in m_meta_processor_jobs)) {
				callback({success:false,error:'Unable to find meta processor job: '+process_id});
				return;
			}
			m_meta_processor_jobs[process_id].cancelJob(callback);
			return;
		}
		*/
		var kulele_url=m_kulele_url;
		var server=m_subserver_name;

		var url0=kulele_url+'/subserver/'+server;
		var req={
			a:'cancel-process',
			process_id:process_id
		};
		post_to_larinet(url0,req,function(tmp) {
			callback(tmp);
		});
		/*
		jsu_http_post_json(url0,req,authorization_headers(),function(tmp) {
		  if (!tmp.success) {
		    callback({success:false,error:tmp.error});
		    return;
		  }
		  callback(tmp.object);
		});
		*/
	}

	function prvUpload(file_data,callback) {
		/*
	    if (!m_subserver_name) {
	      callback({success:false,error:'subserver has not been set (prvUpload)'});
	      return;
	    }
	    */
	    //var data_base64=btoa(String.fromCharCode.apply(null, new Uint8Array(file_data)));
	    //var data_base64=btoa(new Uint8Array(file_data).reduce((data,byte)=>data+String.fromCharCode(byte),''));

	    var data_base64=btoa(new Uint8Array(file_data).reduce(function(data,byte) {return data+String.fromCharCode(byte)},''));

	    var url=m_kulele_url+'/subserver/'+m_subserver_name;
	    var req={
	    	a:'prv-upload',
	    	size:file_data.byteLength,
	    	data_base64:data_base64
	    }
	    post_to_larinet(url,req,function(tmp) {
	    	callback(tmp);
	    });
	    /*
	    jsu_http_post_json(url,req,authorization_headers(),function(tmp) {
	    	if (!tmp.success) {
	    		callback(tmp);
	    		return;
	    	}
	    	callback(tmp.object);
	    });
	    */
	}

	function prvUploadToUserStorage(userid,filename,file_data,callback) {
	    if ((!m_subserver_name)&&(!m_local_mode)) {
	      callback({success:false,error:'subserver has not been set (prvUploadToUserStorage)'});
	      return;
	    }
	    //var data_base64=btoa(String.fromCharCode.apply(null, new Uint8Array(file_data)));
	    //var data_base64=btoa(new Uint8Array(file_data).reduce((data,byte)=>data+String.fromCharCode(byte),''));
	    var data_base64=btoa(new Uint8Array(file_data).reduce(function(data,byte) {return data+String.fromCharCode(byte)},''));
	    var url=m_kulele_url+'/subserver/'+m_subserver_name;
	    var req={
	    	a:'prv-upload',
	    	size:file_data.byteLength,
	    	data_base64:data_base64,
	    	user_storage:true,
	    	userid:userid,
	    	filename:filename
	    }
	    jsu_http_post_json(url,req,authorization_headers(),function(tmp) {
	    	if (!tmp.success) {
	    		callback(tmp);
	    		return;
	    	}
	    	callback(tmp.object);
	    });
	}

	function prvUploadText(txt,callback) {
		var file_data;
		if (typeof TextEncoder != 'undefined') {
			//browser
			var enc=new TextEncoder("utf-8");
			file_data=enc.encode(txt);
		}
		else {
			//nodejs
			file_data=new Buffer(txt,'utf-8');
		}
		prvUpload(file_data,callback);
	}

	function prvUploadTextToUserStorage(userid,filename,txt,callback) {
		var enc=new TextEncoder("utf-8");
		var file_data=enc.encode(txt);
		prvUploadToUserStorage(userid,filename,file_data,callback);
	}

	function download_raw_from_prv(prv) {
		var size_mb=Number(prv.original_size)/1e6;
		if (size_mb>10) {
		  alert('File is too large to download ('+size_mb+' MB)');
		  return;
		}
		O.prvLocate(prv,function(tmp) {
		  if (!tmp.success) {
		    alert('Problem locating file on server: '+name+": "+tmp.error);
		    return;
		  }
		  if (!tmp.found) {
		    alert('Unable to find raw file on server: '+name);
		    return;
		  }
		  if (!tmp.url) {
		    alert('Did not receive a raw url from server: '+name);
		    return;  
		  }
		  var url0=tmp.url;
		  if (m_local_mode)
		  	url0=tmp.full_path;
		  else
		  	url0=url0.split('${base}').join(m_kulele_url+'/subserver/'+m_subserver_name);
		  console.log ('Opening: '+url0);
		  window.open(url0,'_blank');
		});
	}

	/*
	function register_meta_processors() {
		for (var i in meta_processors) {
			var MP=meta_processors[i];
			m_processor_manager.registerMetaProcessor(MP);
		}
	}
	*/

	/*
	var m_meta_processor_jobs={};
	function queue_meta_processor_job(processor_name,inputs,outputs_to_return,params,opts,callback) {
		var obj=m_processor_manager.metaProcessor(processor_name);
		if (!obj) {
			callback({success:false,error:'Unexpected: unable to find meta processor.'});
			return;
		}
		var spec=obj.spec;
		var jobs=obj.jobs;
		var PP=new ProcessingPipeline(0,O);
		for (var iname in inputs) {
			PP.prvListManager().setPrvRecord(iname,{prv:inputs[iname]});
		}
		for (var i=0; i<jobs.length; i++) {
			var obj=jobs[i];
			PP.addNewJob(obj);
		}
		var job_id='meta_'+JSQ.makeRandomId(10);
		var MPJ=new MetaProcessorJob(0,job_id,PP,outputs_to_return);
		m_meta_processor_jobs[job_id]=MPJ;
		callback({success:true,process_id:job_id,complete:false});
	}
	*/
}

/*
function MetaProcessorJob(O,job_id,pipeline,outputs_to_return) {
	O=O||this;
	JSQObject(O);

	this.status=function() {return status();};
	this.probeJob=function(callback) {probeJob(callback);};
	this.cancelJob=function(callback) {cancelJob(callback);};

	var that=this;
	var m_state='running';
	var m_error='';

	for (var i=0; i<pipeline.jobCount(); i++) {
		var JJ=pipeline.job(i);
		JJ.setStatus({state:'pending'});
	}


	function status() {
		var ret={state:m_state,error:m_error};
		return ret;
	}
	function probeJob(callback) {
		if (m_state=='error') {
			callback({success:true,complete:true,result:{success:false,error:m_error}});
			return;
		}
		else if (m_state=='running') {
			var running_processors=[];
			for (var i=0; i<pipeline.jobCount(); i++) {
				var JJ=pipeline.job(i);
				if (JJ.status().state=='running')
					running_processors.push(JJ.processorName());
			}
			var message=running_processors.join(',');
			callback({success:true,process_id:job_id,message:message,complete:false});
		}
		else if (m_state=='finished') {
			var result=make_result();
			callback({success:true,complete:true,result:result})
		}
		else {
			callback({success:false,error:'Unexpected state: '+m_state});
		}
	}
	function cancelJob(callback) {
		if (m_state=='running') {
			stop_all_jobs();
			m_state='error';
			m_error='Meta processor job canceled.';
		}
		callback({success:true});
	}

	function make_result() {
		var outputs={};
		for (var oname in outputs_to_return) {
			if (outputs_to_return[oname]) {
				var prvrec=pipeline.prvListManager().prvRecord(oname);
				if (prvrec) {
					outputs[oname]=JSQ.clone(prvrec.prv);	
				}
				else if (oname!='console_out') {
					return {success:false,error:'Unable to find output prv in meta processor job: '+oname};
				}
			}
		}
		var result={success:true,outputs:outputs};
		return result;
	}

	function housekeeping() {
		var everything_finished=true;
		for (var i=0; i<pipeline.jobCount(); i++) {
			var JJ=pipeline.job(i);
			if (JJ.status().state!='finished')
				everything_finished=false;
		}
		if (everything_finished) {
			m_state='finished';
			return;
		}
		for (var i=0; i<pipeline.jobCount(); i++) {
			var JJ=pipeline.job(i);
			if (JJ.status().state=='error') {
				stop_all_jobs();
				m_state='error';
				m_error='Error in job ('+JJ.processorName()+'): '+JJ.status().error;
				break;
			}
			else if (JJ.status().state=='pending') {
				if (pipeline.readyToRun(JJ)) {
					JJ.start();
				}
			}
			else if (JJ.status().state=='running') {
				everything_done=false;
			}
		}
		if (m_state=='running') {
			setTimeout(housekeeping,500);
		}
	}
	housekeeping();

	function stop_all_jobs() {
		for (var i=0; i<pipeline.jobCount(); i++) {
			var JJ=pipeline.job(i);
			if ((JJ.status().state=='pending')||(JJ.status().state=='running'))
				JJ.stop();
		}
	}

}

var meta_processors=[
	{
		spec:{
			name:'aa.spike_sorting',
			version:'0.0.1',
			inputs:[
				{name:'raw',optional:false},
				{name:'geom',optional:false},
				{name:'annotation_script',optional:false}
			],
			outputs:[
				{name:'firings'},
				{name:'templates'}
			],
			parameters:[
			]
		},
		jobs:[
		    {"processor_name":"mountainsort.bandpass_filter",
		     "inputs":{"timeseries":"raw"},
		     "outputs":{"timeseries_out":"filt"},
		     "parameters":{"samplerate":"30000","freq_min":"300","freq_max":"6000","freq_wid":"1000","quantization_unit":"","subsample_factor":""}
		    },
		    {"processor_name":"mountainsort.whiten",
		     "inputs":{"timeseries":"filt"},
		     "outputs":{"timeseries_out":"pre"},
		     "parameters":{"quantization_unit":""}
		    },
		    {"processor_name":"mountainsort.mountainsort3",
		     "inputs":{"timeseries":"pre","geom":"geom"},
		     "outputs":{"firings_out":"firings1"},
		     "parameters":{"adjacency_radius":"","consolidate_clusters":"","consolidation_factor":"","clip_size":"","detect_interval":"","detect_threshold":"","detect_sign":"1","merge_across_channels":"","fit_stage":"","t1":"","t2":""}
		    },
		    {"processor_name":"mountainsort.cluster_metrics",
		     "inputs":{"timeseries":"pre","firings":"firings1"},
		     "outputs":{"cluster_metrics_out":"metrics1"},
		     "parameters":{"samplerate":"30000"}
		    },
		    {"processor_name":"mountainsort.isolation_metrics",
		     "inputs":{"timeseries":"pre","firings":"firings1"},
		     "outputs":{"metrics_out":"metrics2","pair_metrics_out":""},
		     "parameters":{"compute_bursting_parents":"true"}
		    },
		    {"processor_name":"mountainsort.combine_cluster_metrics",
		     "inputs":{"metrics_list":"metrics1,metrics2"},
		     "outputs":{"metrics_out":"metrics3"},
		     "parameters":{}
		    },
		    {"processor_name":"mountainsort.run_metrics_script",
		     "inputs":{"metrics":"metrics3","script":"annotation_script"},
		     "outputs":{"metrics_out":"metrics_annotated"},
		     "parameters":{}
		    },
		    {"processor_name":"mountainsort.extract_firings",
		     "inputs":{"firings":"firings1","metrics":"metrics_annotated"},
		     "outputs":{"firings_out":"firings"},
		     "parameters":{"exclusion_tags":"rejected","clusters":"","t1":"","t2":""}
		    },
		    {"processor_name":"mountainsort.compute_templates",
		     "inputs":{"timeseries":"filt","firings":"firings1"},
		     "outputs":{"templates_out":"templates1"},
		     "parameters":{"clip_size":"200","clusters":""}
		    },
		    {"processor_name":"mountainsort.compute_templates",
		     "inputs":{"timeseries":"filt","firings":"firings"},
		     "outputs":{"templates_out":"templates"},
		     "parameters":{"clip_size":"200","clusters":""}
		    }]
	}
];
*/