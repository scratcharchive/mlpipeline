function PrvListWidget(O,prv_list_manager) {
  O=O||this;
  JSQWidget(O);
  O.div().addClass('PrvListWidget');
  O.div().addClass('ListWidget');

  this.setProcessingPipeline=function(P) {m_processing_pipeline=P; JSQ.connect(P,'changed',O,refresh); JSQ.connect(P,'job_changed',O,refresh);};
  this.setLabel1=function(label1) {m_label1=label1; refresh();};
  this.refresh=function() {refresh();};
  this.setUploadsAllowed=function(val) {m_uploads_allowed=val; O.refresh();};
  this.setRemoveAllowed=function(val) {m_remove_allowed=val; O.refresh();};
  this.setRenameAllowed=function(val) {m_rename_allowed=val; O.refresh();};
  this.setKuleleClient=function(KC) {m_kulele_client=KC;};
  this.registerViewPlugin=function(VP) {m_view_plugins.push(VP);};

  var m_table=new MLTableWidget();
  var m_processing_pipeline=null;
  var m_label1='Files';
  var m_uploads_allowed=false;
  var m_remove_allowed=true;
  var m_rename_allowed=true;
  var m_kulele_client=null;
  var m_view_plugins=[];
  m_table.setRowsMoveable(false);
  
  O.div().append(m_table.div());
  O.div().css({overflow:"auto"});
      
  JSQ.connect(prv_list_manager,'changed',O,refresh);

  JSQ.connect(O,'sizeChanged',O,update_layout);
  function update_layout() {
    var W=O.width();
    var H=O.height();
    m_table.setSize(W,H);
  }
 
  function refresh() {
    schedule_refresh();
  }

  var s_refresh_scheduled=false;
  function schedule_refresh() {
    if (s_refresh_scheduled) return;
    s_refresh_scheduled=true;
    setTimeout(function() {
      s_refresh_scheduled=false;
      do_refresh();
    },1000);
  }
  function do_refresh() {
    var PM=prv_list_manager;

    m_table.clearRows();
    m_table.setColumnCount(4);
    m_table.headerRow().cell(0).html('');
    m_table.headerRow().cell(1).html('');
    m_table.headerRow().cell(2).html(m_label1);
    m_table.headerRow().cell(3).html('On server');
    m_table.setColumnProperties(0,{"max-width":20}); //buttons1
    m_table.setColumnProperties(1,{"max-width":20}); //buttons2

    var names=PM.prvRecordNames();
    for (var i in names) {
      var name=names[i];
      var row0=create_prv_table_row(name,row0);
      m_table.addRow(row0);
    }

    if (m_uploads_allowed) {
      var row0=m_table.createRow();
      m_table.addRow(row0);
      var upload_button=$('<div title="Upload file or .prv file" class=fab-upload-file><div class=upload-icon /></div>');
      upload_button.click(upload_prv);
      row0.cell(2).append(upload_button);
    }

    update_layout();
  }

  function format_file_size(size_bytes) {
    if (size_bytes>10e9) {
      return Math.floor(size_bytes/1e9)+' GB';
    }
    else if (size_bytes>1e9) {
      return Math.floor(size_bytes/1e8)/10+' GB';  
    }
    else if (size_bytes>10e6) {
      return Math.floor(size_bytes/1e6)+' MB';
    }
    else if (size_bytes>1e6) {
      return Math.floor(size_bytes/1e5)/10+' MB';  
    }
    else if (size_bytes>10e3) {
      return Math.floor(size_bytes/1e3)+' KB';
    }
    else if (size_bytes>1e3) {
      return Math.floor(size_bytes/1e2)/10+' KB';  
    }
    else {
      return size_bytes+' bytes';
    }
  }
  
  function create_prv_table_row(name) {
      var row=m_table.createRow();

      var PM=prv_list_manager;
      var prvrec=PM.prvRecord(name);
      var prv=prvrec.prv||{};
      var content=prvrec.content||null;
      
      var title0='';
      //if (m_rename_allowed) title0+='Click to rename PRV;            ';
      if (content) {
        title0+=JSON.stringify(content).slice(0,50)+'...';
      }
      else {
        title0+='original_path='+jsu_file_parts(prv.original_path||'').file_name+'; checksum='+prv.original_checksum;
      }

      var B1=row.cell(0);
      var B2=row.cell(1);
      var On_server=row.cell(3);

      var Name=$('<span />');
      var rename_button=$('<span class="edit_button" />');
      rename_button.click(function() {edit_prv(name);});
      Name.append(rename_button);
      Name.append('&nbsp;');
      var txt0=name;
      if ((m_processing_pipeline)&&(!consistent_with_processing_job(name,prvrec))) {
        txt0+='*';
        row.tr().addClass('inconsistent_prv');
      }
      Name.append('<span title="'+title0+'"">'+txt0+'</span>');
      if (!content) {
        Name.append($('<span>&nbsp;('+format_file_size(prv.original_size)+')</span>'));
      }
      row.cell(2).append(Name);
      
      
      On_server.empty();
      var elmt;
      if ((!prvrec.on_server)&&(prvrec.on_s3)) {
        elmt=$('<a href=#><span class=on_s3 title="Download '+prvrec.s3_address+' to processing server">On S3</span></a>');
        elmt.click(function() {
          O.emit('download-s3-file-to-processing-server',{s3_address:prvrec.s3_address,sha1:prvrec.prv.original_checksum});
        });
      }
      else {
        elmt=bool2yesno(prvrec.on_server)
      }
      On_server.append(elmt);

      //tr.find('#fname').html(jsu_file_parts(prv.original_path).file_name);
      //tr.find('#checksum').html(prv.original_checksum);

      if (m_remove_allowed) {
        var remove_button=$('<a class=remove_button title="Remove this file" />');
        B1.append(remove_button);
        remove_button.click(function() {ask_remove_prv(name);});
      }
            
      var download_prv_button=$('<a class=download2_button title="Download this .prv file" />');
      B2.append(download_prv_button);
      download_prv_button.click(function() {download_prv(name);});

      var download_raw_button=$('<a class=download_button title="Download the raw file corresponding to this PRV" />');
      B2.append(download_raw_button);
      download_raw_button.click(function() {download_raw(name);});

      if (jsu_ends_with(name,'.banjoview')) {
        var view_button=$('<a class=view_button title="View in new window" />');
        B2.append(view_button);
        view_button.click(function() {open_banjoview(name);});        
      }
      else if ((jsu_ends_with(name,'.txt'))||(jsu_ends_with(name,'.csv'))||(jsu_ends_with(name,'.json'))) {
        var view_button=$('<a class=view_button title="View text file" />');
        B2.append(view_button);
        view_button.click(function() {view_text_file(name);});        
      }
      else {
        for (var i=0; i<m_view_plugins.length; i++) {
          var VP=m_view_plugins[i];
          if (VP.file_extension) {
            if (jsu_ends_with(name,VP.file_extension)) {
              var view_button=$('<a class=view_button title="View '+VP.file_type+' file" />');
              B2.append(view_button);
              view_button.click(function() {VP.callback(name,content||prv);});               
              break;
            }
          }
        }
      }

      if (!prvrec.process_output_name)
        row.tr().addClass('raw_prv');
      
      return row;

      /*
      make_editable(tr.find('#name'),function(new_name) {
        if (name!=new_name) {
          tr.find('#name').html('.....');
          PM.renamePrvRecord(name,new_name);
        }
      })
      */
  }

  function edit_prv(name) {
    var PM=prv_list_manager;
    var prvrec=PM.prvRecord(name);
    var name2=prompt('Name of PRV: ',name);
    if ((name2)&&(name2!=name)) {
      PM.renamePrvRecord(name,name2);
    }
  }
    
  function ask_remove_prv(name) {
    var PM=prv_list_manager;
    if (confirm('Remove prv ('+name+')?')) {
      PM.removePrvRecord(name);
      PM.emit('save');
    }
  }
      
  function upload_prv() {
    var PM=prv_list_manager;
    var pp={
      validate_file:validate_upload_file
    }
    var UP=new FileUploader();
    UP.uploadBinaryFile(pp,function(tmp) {
      if (!tmp.success) {
        alert('Problem uploading: '+tmp.error);
        return;
      }
      if (jsu_ends_with(tmp.file_name,'.prv')) {
        var text=array_buffer_to_text(tmp.data);
        var obj=jsu_parse_json(text);
        if (!obj) {
          alert('Error parsing json in uploaded file');
          return;
        }
        var prvrec={on_server:undefined};
        var prvname=get_default_name();
        PM.setPrvRecord(prvname,{on_server:undefined,prv:obj});
        PM.checkOnServer(prvname);  
      }
      else {
        upload_prv_to_server(tmp.data,function(tmp2) {
          if (!tmp2.success) {
            alert('Error uploading: '+tmp2.error);
            return;
          }
          var stat=tmp2.prv_stat;
          var prvname=get_default_name();
          var prvobj={
            original_checksum:stat.checksum,
            original_size:stat.size,
            original_fcs:stat.fcs,
            original_path:tmp.file_name
          };
          PM.setPrvRecord(prvname,{on_server:undefined,prv:prvobj});
          PM.checkOnServer(prvname);
          edit_prv(prvname);
        });
      }
    });
    function array_buffer_to_text(buf) {
      return String.fromCharCode.apply(null, new Uint8Array(buf));
    }
    function validate_upload_file(ff) {
      if (jsu_ends_with(ff.name,'.prv')) {
        if (ff.size>100000) {
          alert('The selected .prv file is too large: '+ff.size+' bytes');
          return false;
        }  
      }
      else {
        //alert('File must have a .prv extension');
        //return false;
        if (ff.size>100000000) {
          alert('The selected file is too large: '+ff.size+' bytes');
          return false;
        }
      }
      return true;
    }
  }
  function upload_prv_to_server(file_data,callback) {
    var KC=m_kulele_client;
    if (!KC) {
      alert('Unable to upload prv to server. Kulele client not set.');
      return;
    }
    KC.prvUpload(file_data,function(tmp) {
      callback(tmp);
    });
  }
  
  function get_default_name() {
    var PM=prv_list_manager;
    var names=PM.prvRecordNames();
    var num=1;
    while (names.indexOf('prv'+num)>=0) num++;
    return 'prv'+num;
  }

  function bool2yesno(val) {
    if (val===true) return $('<span class=yes>Yes</span>');
    else if (val===false) return $('<span class=no>No</span>');
    else if (val===undefined) return $('<span class=unknown>Unknown</span>');
    else return $('<span />');
  }

  function download_prv(name) {
    var prvrec=prv_list_manager.prvRecord(name);
    if (!prvrec) return;
    if (prvrec.content) {
      alert('This is not a prv object');
      return;
    }
    var json=JSON.stringify(prvrec.prv,null,4);
    download(json,name+'.prv');
  }

  function download_raw(name) {
    var prvrec=prv_list_manager.prvRecord(name);
    if (!prvrec) return;
    if (prvrec.content) {
      alert('This is not a prv object');
      return;
    }
    var prv=prvrec.prv;
    var KS=prv_list_manager.kuleleClient();
    KS.downloadRawFromPrv(prv);
  }

  function open_banjoview(name) {
    O.emit('open_banjoview',{prvrec:prv_list_manager.prvRecord(name)});
  }

  function view_text_file(name) {
    O.emit('view_text_file',{name:name,prvrec:prv_list_manager.prvRecord(name)});
  }

  function consistent_with_processing_job(prvname,prvrec) {
    if (!m_processing_pipeline) return true;
    if (!prvrec.process_output_name) return true;
    prvrec.process=prvrec.process||{};
    var PRM=prv_list_manager;
    for (var j=0; j<m_processing_pipeline.jobCount(); j++) {
      var job=m_processing_pipeline.job(j);
      var outputs0=job.outputs();
      for (var key in outputs0) {
        if (outputs0[key]==prvname) {
          if (key!=prvrec.process_output_name) return false;
          if (job.processorName()!=prvrec.process.processor_name) return false;
          if (!parameters_match(job.parameters(),prvrec.process.parameters)) return false;
          var process0_inputs=prvrec.process.inputs;
          var job_inputs=job.inputs();
          for (var ikey in job_inputs) {
            if (job_inputs[ikey]) {
              var prv1=process0_inputs[ikey]||{};
              var prv2=PRM.prv(job_inputs[ikey])||{};
              if (!prvs_match(prv1,prv2)) return false;
            }
          }
          return true;      
        }
      }
    }
    return false;
  }
  function parameters_match(params1,params2) {
    for (var key in params1) {
      if (!(key in params2)) return false;
      if (!(params1[key]==params2[key])) return false;
    }
    for (var key in params2) {
      if (!(key in params1)) return false;
    }
    return true;
  }
  function prvs_match(prv1,prv2) {
    if (prv1.original_size!=prv2.original_size) return false;
    if (prv1.original_checksum!=prv2.original_checksum) return false;
    return true;
  }
    
  refresh();
}