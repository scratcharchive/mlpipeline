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
function DocStorClient() {

	this.login=function(info,callback) {login(info,callback);};
	this.user=function() {return m_user;};
	this.setDocStorUrl=function(url) {m_docstor_url=url;};
	this.findDocuments=function(opts,callback) {findDocuments(opts,callback);};
	this.createDocument=function(opts,callback) {createDocument(opts,callback);};
	this.getDocument=function(id,opts,callback) {getDocument(id,opts,callback);};
	this.setDocument=function(id,opts,callback) {setDocument(id,opts,callback);};
	this.getAccessRules=function(callback) {getAccessRules(callback);};
	this.setAccessRules=function(rules,callback) {setAccessRules(rules,callback);};
	this.removeDocument=function(id,callback) {removeDocument(id,callback);};
	this.removeDocuments=function(ids,callback) {removeDocuments(ids,callback);};
	this.requestPrvUploadCredentials=function(id,callback) {requestPrvUploadCredentials(id,callback);};
	this.requestPrvDownloadCredentials=function(id,callback) {requestPrvDownloadCredentials(id,callback);};
	this.findPrvContent=function(id,callback) {findPrvContent(id,callback);};
	this.reportSuccessfulUpload=function(data,callback) {reportSuccessfulUpload(data,callback);};
	this.reportSuccessfulDownload=function(data,callback) {reportSuccessfulDownload(data,callback);};

	var m_docstor_url='';
	var m_authorization_header='';
	var m_user='';

	function login(info,callback) {
		info.id_token=info.id_token||info.google_id_token; //too hacky?
		if (info.passcode) {
			m_authorization_header='Passcode '+info.passcode;
		}
		else if (info.id_token) {
			m_authorization_header='Bearer '+info.id_token;	
		}
		else {
			callback('Invalid info for login in DocStorClient');
			return;
		}
		api_call('getUser',{},function(err,resp) {
			if (err) {
				callback(err);
				return;
			}
			m_user=resp.user||'';
			callback(null);
		});
	}

	function findDocuments(opts,callback) {
		var query={};
		if ('owned_by' in opts) query.owned_by=opts.owned_by;
		if ('shared_with' in opts) query.shared_with=opts.shared_with;
		if ('and_shared_with' in opts) query.and_shared_with=opts.and_shared_with;
		if ('filter' in opts) query.filter=JSON.stringify(opts.filter);
		api_call('findDocuments',query,function(err,resp) {
			if (err) {
				callback(err);
				return;
			}
			callback(null,resp.documents);
		});
	}

	function getAccessRules(callback) {
		api_call('getAccessRules',{},function(err,resp) {
			if (err) {
				callback(err);
				return;
			}
			callback(null,resp.access_rules);
		});
	}
	function setAccessRules(rules,callback) {
		api_call('setAccessRules',{access_rules:JSON.stringify(rules)},function(err,resp) {
			if (err) {
				callback(err);
				return;
			}
			callback(null);
		});
	}
	function createDocument(opts,callback) {
		if (!opts.owner) {
			callback('Unable to create document with no owner.',null);
			return;
		}
		var owner=opts.owner;
		api_call('createDocument',{owner:owner},function(err,resp) {
			if (err) {
				callback(err);
				return;
			}
			if ((opts.content)||(opts.attributes)||(opts.permissions)) {
				setDocument(resp.id,opts,function(err) {
					if (err) {
						callback('Error setting document content, attributes or permissions: '+err);
						return;
					}
					else {
						callback(null,{id:resp.id});
					}
				});
			}
			else {
				callback(null,{id:resp.id});
			}
		});
	}
	function setDocument(id,opts,callback) {
		var opts2={id:id};
		if ('attributes' in opts)
			opts2.attributes=JSON.stringify(opts.attributes);
		if ('permissions' in opts)
			opts2.permissions=JSON.stringify(opts.permissions);
		if ('content' in opts)
			opts2.content=opts.content;
		api_call('setDocument',opts2,function(err,resp) {
			if (err) {
				callback(err);
				return;
			}
			callback(null,resp);
		});
	}
	function getDocument(id,opts,callback) {
		var opts={id:id,include_content:opts.include_content};
		api_call('getDocument',opts,function(err,resp) {
			if (err) {
				callback(err,null);
				return;
			}
			callback(null,resp);
		});
	}
	function removeDocument(id,callback) {
		api_call('removeDocument',{id:id},function(err) {
			if (err) {
				callback(err);
				return;
			}
			callback(null);
		});
	}
	function removeDocuments(ids,callback) {
		api_call('removeDocuments',{ids:ids},function(err) {
			if (err) {
				callback(err);
				return;
			}
			callback(null);
		});
	}

	function requestPrvUploadCredentials(id,callback) {
		api_call('requestPrvUploadCredentials',{id:id},function(err,resp0) {
			if (err) {
				callback(err);
				return;
			}
			callback(null,resp0.credentials);
		});
	}

	function requestPrvDownloadCredentials(id,callback) {
		api_call('requestPrvDownloadCredentials',{id:id},function(err,resp0) {
			if (err) {
				callback(err);
				return;
			}
			callback(null,resp0.credentials);
		});
	}

	function reportSuccessfulDownload(size_bytes,callback) {
		api_call('reportSuccessfulDownload',{size_bytes:size_bytes},function(err) {
			if (err) {
				callback(err);
				return;
			}
			callback(null);
		});
	}

	function reportSuccessfulUpload(size_bytes,callback) {
		api_call('reportSuccessfulUpload',{size_bytes:size_bytes},function(err) {
			if (err) {
				callback(err);
				return;
			}
			callback(null);
		});
	}

	function findPrvContent(id,callback) {
		api_call('findPrvContent',{id:id},function(err,resp0) {
			if (err) {
				callback(err);
				return;
			}
			callback(null,resp0);
		});
	}

	function api_call(name,query,callback) {
		jsu_http_post_json(m_docstor_url+'/api/'+name,query,{authorization:m_authorization_header},function(tmp) {
			if (!tmp.success) {
				callback('Error making request: '+tmp.error,null);
				return;
			}
			tmp=tmp.object;
			if (!tmp.success) {
				callback(tmp.error,null);
				return;
			}
			callback(null,tmp);
		});
	}
}

function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}
