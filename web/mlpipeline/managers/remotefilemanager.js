function RemoteFileManager() {
	var that=this;

	this.setKuleleClient=function(KC) {m_kulele_client=KC;};

	this.prvServerStatus=function(prv) {return prvServerStatus(prv);};
	this.checkPrvServerStatus=function(prv) {checkPrvServerStatus(prv);};
	this.onPrvServerStatusChanged=function(handler) {onPrvServerStatusChanged(handler);};

	this.prvRBStatus=function(prv) {return prvRBStatus(prv);};
	this.checkPrvRBStatus=function(prv) {checkPrvRBStatus(prv);};
	this.onPrvRBStatusChanged=function(handler) {onPrvRBStatusChanged(handler);};

	this.startDownloadFromRBToServer=function(prv) {startDownloadFromRBToServer(prv);};

	var m_kulele_client=null;

	var m_prv_server_status_by_sha1={};
	var m_prv_server_status_changed_handlers=[];

	var m_prv_rb_status_by_sha1={};
	var m_prv_rb_status_changed_handlers=[];

	function prvServerStatus(prv) {
		return m_prv_server_status_by_sha1[prv.original_checksum]||{status:'unknown'};
	}
	function onPrvServerStatusChanged(handler) {
		m_prv_server_status_changed_handlers.push(handler);
	}
	function set_prv_server_status(prv,status,message) {
		var sha1=prv.original_checksum;
		if (!(sha1 in m_prv_server_status_by_sha1)) {
			m_prv_server_status_by_sha1[sha1]={};
		}
		var A=m_prv_server_status_by_sha1[sha1];
		if ((A.status!=status)||(A.message!=message)) {
			A.status=status;
			A.message=message;
			trigger_prv_server_status_changed(sha1);
		}
	}
	function trigger_prv_server_status_changed(sha1) {
		for (var i in m_prv_server_status_changed_handlers) {
			m_prv_server_status_changed_handlers[i](sha1);
		}
	}



	function prvRBStatus(prv) {
		return m_prv_rb_status_by_sha1[prv.original_checksum]||{status:'unknown'};
	}
	function onPrvRBStatusChanged(handler) {
		m_prv_rb_status_changed_handlers.push(handler);
	}
	function set_prv_rb_status(prv,status,message) {
		var sha1=prv.original_checksum;
		if (!(sha1 in m_prv_rb_status_by_sha1)) {
			m_prv_rb_status_by_sha1[sha1]={};
		}
		var A=m_prv_rb_status_by_sha1[sha1];
		if ((A.status!=status)||(A.message!=message)) {
			A.status=status;
			A.message=message;
			trigger_prv_rb_status_changed(sha1);
		}
	}
	function trigger_prv_rb_status_changed(sha1) {
		for (var i in m_prv_rb_status_changed_handlers) {
			m_prv_rb_status_changed_handlers[i](sha1);
		}
	}

	function checkPrvServerStatus(prv) {
		if (that.prvServerStatus(prv)=='checking') {
			//we are already checking
			return;
		}
		if (!m_kulele_client) {
			console.error('Unable to check prv server status: kulele client not set in RemoteFileManager.');
			return;
		}
		set_prv_server_status(prv,'checking','');
		m_kulele_client.prvLocate(prv,function(tmp) {
			if (!tmp.success) {
				set_prv_server_status(prv,'error','Error in prvLocate: '+tmp.error);
				return;
			}
			if (tmp.found) {
				set_prv_server_status(prv,'on_server','');
				return;
			}
			else {
				set_prv_server_status(prv,'not_on_server','');
				return;	
			}
		});
	}
	function checkPrvRBStatus(prv) {
		if (that.prvRBStatus(prv)=='checking') {
			//we are already checking
			return;
		}
		var sha1=prv.original_checksum;
		var DM=new RBDownloadManager(prv);
		set_prv_rb_status(prv,'checking','');
		DM.stat(sha1,function(err,tmp) {
			if (err) {
				set_prv_rb_status(prv,'error',err);
				return;
			}
			if (tmp.found) {
				set_prv_rb_status(prv,'on_rb','');
				return;
			}
			else {
				set_prv_rb_status(prv,'not_on_rb','');
			}
		});
	}

	function startDownloadFromRBToServer(prv) {
		var timer0=new Date();
		var server_status=that.prvServerStatus(prv).status;
		if ((server_status!='not_on_server')&&(server_status!='error')) {
			console.warn('Not downloading from RB to server because server status ('+server_status+') is not equal to "not_on_server" nor "error"');
			return;
		}
		set_prv_server_status(prv,'downloading','Starting download');
		var DM=new RBDownloadManager(prv);
		DM.setKuleleClient(m_kulele_client);
		DM.startDownload(prv.original_checksum,function(err) {
			if (err) {
				set_prv_server_status(prv,'error','Error starting download: '+err);
				return;
			}
			do_probe();
		});
		function do_probe() {
			DM.probeDownload(prv.original_checksum,function(err,A) {
				if (err) {
					set_prv_server_status(prv,'error','Error probing download: '+err);
					return;		
				}
				if (A.status=='error') {
					set_prv_server_status(prv,'error','Error downloading: '+A.error);
					return;			
				}
				else if (A.status=='running') {
					var elapsed=Math.floor(((new Date())-timer0)/1000);
					console.log ('Downloading file from rawbucket to processing server. Elapsed: '+elapsed+' sec.');
					set_prv_server_status(prv,'downloading','Downloading '+format_file_size(prv.original_size)+' MB from rawbucket to processing server. Elapsed: '+elapsed+' sec.');
					setTimeout(do_probe,3000);
					return;
				}
				else if (A.status=='finished') {
					var elapsed=Math.floor(((new Date())-timer0)/1000);
					console.log ('Downloaded '+format_file_size(prv.original_size)+' MB from rawbucket to processing server. Elapsed: '+elapsed+' sec.');
					set_prv_server_status(prv,'unknown',''); //this will trigger a check.
				}
				else {
					set_prv_server_status(prv,'error','Unexpected status in do_probe: '+A.status);
					return;				
				}
			});
		}
	}
}

function RBDownloadManager(O) {
	this.setKuleleClient=function(KC) {m_kulele_client=KC;};
	this.stat=function(sha1,callback) {stat(sha1,callback);};
	this.startDownload=function(sha1,callback) {startDownload(sha1,callback);};
	this.probeDownload=function(sha1,callback) {probeDownload(sha1,callback);};

	var m_rb_url='https://river.simonsfoundation.org';
	var m_kulele_client=null;

	var m_downloads_in_progress_by_sha1={};

	function stat(sha1,callback) {
		var url=m_rb_url+'/stat/'+sha1;
	    jsu_http_get_json(url,{},function(tmp) {
	      if (!tmp.success) {
	        callback(tmp.error,null);
	        return;
	      }
	      tmp=tmp.object;
	      if (!tmp.success) {
	        callback(null,{found:false});
	        return;
	      }
	      callback(null,{found:true,size:tmp.size});
	    });
	}
	function startDownload(sha1,callback) {
		if (!m_kulele_client) {
			console.error('Unable to start RB download: kulele client is null.');
			return;
		}

		if (sha1 in m_downloads_in_progress_by_sha1) {
			var A=m_downloads_in_progress_by_sha1[sha1];
			if ((A.status!='finished')&&(A.status!='error')) {
				console.log ('Warning: in-progress download already exists for sha1='+sha1);
				callback(null);
				return;
			}
		}

		console.log('queueing rbdownload.download: '+sha1);
		var A={
			sha1:sha1,
			status:'starting'
		}
		m_downloads_in_progress_by_sha1[sha1]=A;
		m_kulele_client.queueJob(
			'rbdownload.download',
			{},
			{output:true},
			{sha1:sha1},
			{},
			function(tmp) {
				console.log(tmp);
				if (!tmp.success) {
					A.status='error';
					A.error=tmp.error;
					callback(tmp.error);
					return;
				}
				A.status='running';
				A.process_id=tmp.process_id;
				handle_probe_response(sha1,tmp);
				callback(null);
			}
		);
	}
	function probeDownload(sha1,callback) {
		if (!(sha1 in m_downloads_in_progress_by_sha1)) {
			callback('No such download for sha1='+sha1);
			return;
		}
		var A=m_downloads_in_progress_by_sha1[sha1];
		if ((A.status=='error')||(A.status=='finished')) {
			callback(null,A);
			return;
		}
		m_kulele_client.probeJob(A.process_id,function(resp) {
			if (!resp.success) {
				callback('Error probing job: '+resp.error);
				return;
			}
			handle_probe_response(sha1,resp);
			callback(null,A);
		});
	}
	function handle_probe_response(sha1,resp) {
		var A=m_downloads_in_progress_by_sha1[sha1]||{};
		if (resp.complete) {
			if (resp.result.success) {
				A.status='finished';
			}
			else {
				A.status='error';
				A.error=resp.result.error;
			}
		}
		else {
			A.status='running';
		}
	}
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