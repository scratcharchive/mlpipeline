var s_rawbucket_client_data={
	stats_by_sha1:{}
}

function RawBucketClient() {
	this.clear=function() {s_rawbucket_client_data.stats_by_sha1={};};
	this.stat=function(sha1,size_bytes,callback) {stat(sha1,size_bytes,callback);}

	function stat(sha1,size_bytes,callback) {
		if (s_rawbucket_client_data.stats_by_sha1[sha1]) {
			callback(null,s_rawbucket_client_data.stats_by_sha1[sha1]);
			return;
		}
		var url0='https://river.simonsfoundation.org';
		jsu_http_get_json(url0+'/stat/'+sha1,function(tmp) {
			if (!tmp.success) {
				callback('Error in http_get_json: '+tmp.error,null);
				return;
			}
			var obj=tmp.object;
			if (!obj.success) {
				callback(null,{found:false});
				return;	
			}
			if (size_bytes!=obj.size) {
				callback('Found file has incorrect size: '+obj.size+' <> '+size_bytes,null);
				return;
			}
			var stat0={found:true,url:url0+'/download/'+sha1,size:obj.size};
			s_rawbucket_client_data.stats_by_sha1[sha1]=stat0;
			callback(null,stat0);
		});
	}
}