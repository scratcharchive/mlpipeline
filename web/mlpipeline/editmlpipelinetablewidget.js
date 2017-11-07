function EditMLPipelineTableWidget(O,processor_manager) {
  O=O||this;
  JSQWidget(O);
  O.div().addClass('EditMLPipelineTableWidget');
  O.div().addClass('ListWidget');

  this.setPipelineObject=function(obj) {setPipelineObject(obj);};
  this.pipelineObject=function() {return m_pipeline.object();};
  this.setStartJobsEnabled=function(val) {m_start_jobs_enabled=val;};
  this.setJobManager=function(JM) {setJobManager(JM);};

  var m_pipeline=new MLPipeline();
  var m_table=new MLTableWidget();
  m_table.setRowsMoveable(true);
  var m_start_jobs_enabled=true;
  var m_job_manager=null;
  
  O.div().append(m_table.div());
  O.div().css({overflow:"auto"});

  m_pipeline.onChanged(function() {
    O.emit('pipeline_edited');
    refresh();
  });
  JSQ.connect(m_table,'rows_moved',O,on_rows_moved);

  JSQ.connect(O,'sizeChanged',O,update_layout);
  function update_layout() {
    var W=O.width();
    var H=O.height();
    m_table.setSize(W,H);
  }
  /*
  function determine_font_size_from_colwidth(colwidth) {
    return Math.max(11,Math.min(14,colwidth/6));
  }
  */

  function setJobManager(JM) {
    m_job_manager=JM;
    JSQ.connect(m_job_manager,'job_added',O,update_contents);
    JSQ.connect(m_job_manager,'job_status_changed',O,update_contents);
  }

  function setPipelineObject(obj) {
    if (JSON.stringify(obj)==JSON.stringify(m_pipeline.object())) return;
    m_pipeline.setObject(obj);
  }
 
  function refresh() {
    schedule_refresh();
  }
  var s_refresh_scheduled=false;
  var s_last_refresh_time=null;
  function schedule_refresh() {
    if (s_refresh_scheduled) return;
    if ((!s_last_refresh_time)||(((new Date())-s_last_refresh_time)>1000)) {
      do_refresh();
      return;
    }
    s_refresh_scheduled=true;
    setTimeout(function() {
      s_refresh_scheduled=false;
      do_refresh();
    },1000);
  }
  function do_refresh() {
    s_last_refresh_time=new Date();
    m_table.clearRows();
    m_table.setColumnCount(8);
    m_table.headerRow().cell(0).html('');
    m_table.headerRow().cell(1).html('');
    m_table.headerRow().cell(2).html('');
    m_table.headerRow().cell(3).html('Step');
    m_table.headerRow().cell(4).html('Inputs');
    m_table.headerRow().cell(5).html('Outputs');
    m_table.headerRow().cell(6).html('Parameters');
    m_table.headerRow().cell(7).html('Status');
    m_table.setColumnProperties(0,{"max-width":20}); //buttons1
    m_table.setColumnProperties(1,{"max-width":20}); //buttons2
    m_table.setColumnProperties(2,{"max-width":20}); //buttons3
    for (var i=0; i<m_pipeline.stepCount(); i++) {
		var row0=m_table.createRow();
		row0.step_index=i;
		row0.setIsMoveable(true);
		m_table.addRow(row0);
    }
    
    var row0=m_table.createRow();
    m_table.addRow(row0);
    var add_button=$('<a id=add href="#">Add step</a>');
    add_button.click(add_step);
    row0.cell(3).append(add_button);
    update_layout();
    update_contents();
  }

  function update_contents() {
    for (var i=0; i<m_table.rowCount(); i++) {
      var row=m_table.row(i);
      if (row.step_index>=0) {
        var step=m_pipeline.step(row.step_index);
        update_step_table_row(row,step);
      }
    }
  }

  function on_rows_moved() {
    var new_step_order=[];
    for (var i=0; i<m_table.rowCount(); i++) {
      var row=m_table.row(i);
      if (row.step_index>=0) {
        new_step_order.push(row.step_index);
        row.step_index=i; //after reordering this will be the correct step_index
      }
    }
    m_pipeline.reorderSteps(new_step_order);
  }
  
  function update_step_table_row(row,step) {

    step.step_type=step.step_type||'processor';
    if (step.step_type=='processor') {
      row.cell(3).html(format_processor_name(step.processor_name));
    }
    else if (step.step_type=='pipeline') {
      row.cell(3).html(format_pipeline_name(step.pipeline_name));
    }
    else if (step.step_type=='json_output') {
      row.cell(3).html(format_processor_name('JSON output'));
    }
      
    row.cell(6).empty();
    row.cell(6).append(create_parameters_cell(step.parameters));
    row.cell(7).empty();
    //row.cell(7).append(create_status_cell(job.status(),job.consolePrv()));

    row.cell(0).empty();
    var remove_button=$('<a class=remove_button title="Remove step from pipeline" />');
    row.cell(0).append(remove_button);
    remove_button.click(function() {ask_remove_step(step);});


    var edit_button=$('<a class=edit_button title="Edit step" />');
    edit_button.click(function() {edit_step(row.step_index);});
    var duplicate_button=$('<a class=duplicate_button title="Duplicate step" />');
    duplicate_button.click(function() {duplicate_step(step);});
    row.cell(1).empty();
    row.cell(1).append(edit_button);
    row.cell(1).append('&nbsp;');
    row.cell(1).append(duplicate_button);

    var job0=m_job_manager.findLastJobForStep(m_pipeline.name(),step);
    if (job0) {
      row.job=job0;
      JSQ.connect(job0,'status_changed',O,update_job_status);
    }
    update_job_status();
    function update_job_status() {
      row.cell(2).empty();
      row.cell(7).empty();
      var job=row.job||null;
      if (job) {
        var elmt=create_status_element(job);
        row.cell(7).append(elmt);
      }
      if (m_start_jobs_enabled) {
        var job_status='';
        if (job) job_status=job.status();
        if ((job_status=='running')||(job_status=='pending')) {
          var stop_button=$('<a class=stop_button title="Stop/cancel job" />');
          stop_button.click(function() {O.emit('stop_job',{job:job});});
          row.cell(2).append(stop_button);
        }
        else {
          var start_button=$('<a class=start_button title="Start job" />');
          start_button.click(function() {O.emit('start_job',{step:step});});
          row.cell(2).append(start_button);
        }
      }

      row.cell(4).empty();
      row.cell(4).append(create_inputs_cell(step.inputs,step,job));
      row.cell(5).empty();
      row.cell(5).append(create_outputs_cell(step.outputs,step,job));

    }
  }
  function shorten(txt,len) {
    if (txt.length>len) {
      return txt.slice(0,len-3)+'...';
    }
    else  return txt;
  }
  function create_status_element(job) {
    var status=job.status()||'';
    var ret=$('<div />');
    var tmp=$('<span class="status '+status+'"">'+status+'</span>');
    var title0='';
    if (status=='error') title0=(job.error()||'');
    if (status=='finished') title0='Job finished. Click to download console output.';
    var aa=$('<a href=# title="'+title0+'"></a>');
    if ((status=='finished')||(status=='error')) {
      aa.click(function() {
        var output_files=job.outputFiles();
        if (!output_files['console_out']) {
          alert('Problem: output_files.console_out is undefined');
          return;
        }
        download_console_prv(output_files['console_out'].prv);
      });
    }
    else {
      aa.click(function() {
        show_status(job);
      });
    }
    aa.append(tmp);
    ret.append(aa);
    if (status=='error') ret.append(' '+shorten(job.error()||'',60))
    //if (status=='running') {
    //  ret.append(' '+(status.message||''));
    //}
    return ret;
  }
  function create_inputs_cell(X,step,job) {
    var keyval_list=[];
    var prv_elements=[];
    var job_input_files=null;
    if (job) job_input_files=job.inputFiles();
    for (var key in X) {
      if (X[key]) {
        var input0=X[key];
        if (typeof(input0)=='string') input0=[input0];
        if ((job_input_files)&&(job_input_files[key])) {
          if (input0.length==1) job_input_files[key]=[job_input_files[key]];
          for (var i=0; i<input0.length; i++) {
            var elmt=create_prv_element(input0[i],job_input_files[key][i]);
            prv_elements.push(elmt);
          }
        }
        else {
          for (var i=0; i<input0.length; i++) {
            var elmt=$('<span>'+input0[i]+'</span>');
            prv_elements.push(elmt);
          }  
        }
      }
      keyval_list.push(key+":"+input0);
    }
    var title0=keyval_list.join(', ');
    var ret=$('<span title="'+title0+'" />');
    for (var i=0; i<prv_elements.length; i++) {
      if (i>0) ret.append(', ');
      ret.append(prv_elements[i]);
    }
    return ret;
  }
  function create_outputs_cell(X,step,job) {
    var keyval_list=[];
    var prv_elements=[];
    var job_output_files=null;
    if (job) job_output_files=job.outputFiles();
    for (var key in X) {
      if (X[key]) {
        var output0=X[key];
        if (typeof(output0)=='string') output0=[output0];
        if ((job_output_files)&&(job_output_files[key])) {
          if (output0.length==1) job_output_files[key]=[job_output_files[key]];
          for (var i=0; i<output0.length; i++) {
            var elmt=create_prv_element(output0[i],job_output_files[key][i]);
            prv_elements.push(elmt);
          }
        }
        else {
          for (var i=0; i<output0.length; i++) {
            var elmt=$('<span>'+output0[i]+'</span>');
            prv_elements.push(elmt);
          }  
        }
      }
      keyval_list.push(key+":"+output0);
    }
    var title0=keyval_list.join(', ');
    var ret=$('<span title="'+title0+'" />');
    for (var i=0; i<prv_elements.length; i++) {
      if (i>0) ret.append(', ');
      ret.append(prv_elements[i]);
    }
    return ret;
  }
  /*
  function create_outputs_cell(X,step,job) {
    var keyval_list=[];
    var prv_elements=[];
    for (var key in X) {
      if (X[key]) {
        var output0=X[key];
        //var elmt=create_prv_element(output0,step,key);
        var elmt=$('<span>'+output0+'</span>');
        prv_elements.push(elmt);
      }
      keyval_list.push(key+":"+output0);
    }
    var title0=keyval_list.join(', ');
    var ret=$('<span title="'+title0+'" />');
    for (var i=0; i<prv_elements.length; i++) {
      if (i>0) ret.append(', ');
      ret.append(prv_elements[i]);
    }
    return ret;
  }
  */
  function check_on_server(prv,callback) {
    m_job_manager.kuleleClient().prvLocate(prv,function(tmp) {
      callback(tmp.found);
    });
  }
  function create_prv_element(name,prvrec) {
    var ret=$('<a href=#>'+name+'</a>');
    update0();
    function update0() {
      check_on_server(prvrec.prv,function(found) {
        ret.removeClass('yes');
        ret.removeClass('no');
        ret.removeClass('unknown');
        if (found===true) {
          ret.addClass('yes');
        }
        else if (found===false) {
          ret.addClass('no');
        }
        else {
          ret.addClass('unknown');
        }
      });
    }
    return ret;
  }
  /*
  function create_prv_element(prv_name,step,output_name) {
    var PLM=m_pipeline.prvListManager();
    
    var ret=$('<span></span>');
    JSQ.connect(PLM,'changed',O,update_content);
    update_content();
    function update_content() {
      var prvrec=PLM.prvRecord(prv_name);
      if (!prvrec) {
        ret.html('<span>['+prv_name+']</span>');
      }
      else {
        var process0=prvrec.process||{};
        var process_output_name=prvrec.process_output_name||'';
        var txt0=prv_name;
        if (output_name) {
          if (!is_consistent_with_process_output(job,output_name,process0,process_output_name)) {
            txt0+='*';
          }
        }
        if (prvrec.on_server===true) {
          ret.html('<span class=yes>'+txt0+'</span>');
        }
        else if (prvrec.on_server===false) {
          ret.html('<span class=no>'+txt0+'</span>');
        }
        else {
          ret.html('<span class=unknown>'+txt0+'</span>');
        }
      }
    }
    return ret;
  }
  function is_consistent_with_process_output(job,output_name,process0,process_output_name) {
  	
    var PRM=m_pipeline.prvListManager();
    if (process_output_name!=output_name) return false;
    if (job.processorName()!=process0.processor_name) return false;
    var job_parameters=job.parameters();
    var process0_parameters=process0.parameters||{};
    if (!parameters_match(job_parameters,process0_parameters)) return false;
    var job_inputs=job.inputs();
    var process0_inputs=process0.inputs||{};
    for (var key in job_inputs) {
      if (job_inputs[key]) {
        var prv1=process0_inputs[key]||{};
        var prv2=PRM.prv(job_inputs[key])||{};
        if (!prvs_match(prv1,prv2)) return false;
      }
      else {
        if (process0_inputs[key]) return false;
      }
    }
    var job_outputs=job.outputs();
    var process0_outputs=process0.outputs||{};
    var prv1=PRM.prv(job_outputs[process_output_name])||{};
    var prv2=process0_outputs[process_output_name]||{};
    if (!prvs_match(prv1,prv2)) return false;
    return true;
    
  }
  */
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
  
  function create_parameters_cell(X) {
    var keyval_list=[];
    var val_list=[];
    for (var name in X) {
      if (X[name]) {
        val_list.push(X[name]);
      }
      keyval_list.push(name+":"+X[name]);
    }
    var txt=val_list.join(', ');
    var title0=keyval_list.join(', ');
    return $('<span title="'+title0+'">'+txt+'</span>');
  }

  /*
  function create_status_cell(status,console_prv) {
    var ret=$('<div />');
    var state=status.state||'';
    var tmp=$('<span class="status_state '+state+'"">'+state+'</span>');
    var title0='';
    if (state=='error') title0=(status.error||'');
    if (state=='finished') title0='Job finished. Click to download console output.';
    var aa=$('<a href=# title="'+title0+'"></a>');
    if (state=='finished') {
      aa.click(function() {
        download_console_prv(console_prv);
      });
    }
    else {
      aa.click(function() {
        show_status(status);
      });
    }
    aa.append(tmp);
    ret.append(aa);
    if (state=='running') {
      ret.append(' '+(status.message||''));
    }
    return ret;
  }
  */

  function show_status(job) {
    if (job.status()=='error')
      alert(job.error());
  }
    
  function ask_remove_step(step) {
    if (confirm('Remove step?')) {
      m_pipeline.removeStep(step);
    }
  }
      
  function add_step() {
    create_new_step(function(step) {
      m_pipeline.addStep(step);
      edit_step(m_pipeline.stepCount()-1);
    });
  }
  function create_new_step(callback) {
    var X=new NewStepDialog(0,processor_manager,m_job_manager.document());
    JSQ.connect(X,'accepted',O,function() {
      callback(X.step());
    });
    X.show();
  }
  function get_spec_for_processor_name(processor_name) {
    var spec=processor_manager.processorSpec(processor_name);
    if (!spec) {
      var pipeline0=m_job_manager.document().pipelineListManager().findPipeline(processor_name);
      if (pipeline0) {
        spec=pipeline0.spec();
        spec.is_pipeline=true;
      }
      else return null;
    }
    return spec;
  }
  function make_default_step(processor_name) {
    //var KS=m_pipeline.kuleleClient();

    var P={processor_name:processor_name,inputs:{},outputs:{},parameters:{}};
    var spec=get_spec_for_processor_name(processor_name);
    if (!spec) return P;
    var inputs0=spec.inputs||[];
    var outputs0=spec.outputs||[];
    var parameters0=spec.parameters||[];
    for (var i=0; i<inputs0.length; i++) {
      P.inputs[inputs0[i].name]='';
    }
    for (var i=0; i<outputs0.length; i++) {
      P.outputs[outputs0[i].name]='';
    }
    for (var i=0; i<parameters0.length; i++) {
      P.parameters[parameters0[i].name]='';
    }

    return P;
  }

  function edit_step(step_index) {
    if (step_index>=m_pipeline.stepCount()) return;
    var step=m_pipeline.step(step_index);
    step.step_type=step.step_type||'processor';
    var X=new EditStepDialog(0);
    var spec=null;
    if (step.step_type=='processor') {
      spec=processor_manager.processorSpec(step.processor_name||'');
      if (!spec) {
        console.log ('Warning: Unable to find spec for processor: '+(step.processor_name||''));
      }
    }
    else if (step.step_type=='pipeline') {
      var pipeline0=m_job_manager.document().pipelineListManager().findPipeline(step.pipeline_name);
      if (pipeline0) {
        spec=pipeline0.spec();
      }
      else {
        console.log ('Warning: Unable to find pipeline: '+(step.pipeline_name||''));
      }
    }

    if (!spec) {
      spec={inputs:[],outputs:[],parameters:[]};
    }
    
    if (step.step_type=='processor') {
      spec.outputs.push({name:'console_out',optional:true,description:''});
    }
    X.setSpec(spec);
    X.setStep(step);
    X.show();
    JSQ.connect(X,'accepted',O,function() {
      m_pipeline.setStep(step_index,X.step());
    });
  }

  function duplicate_step(step) {
    var X=m_pipeline.insertStep(m_pipeline.getStepIndex(step)+1,step);
  }

  /*
  function start_job(job) {
    job.setStatus({state:'pending'});
  }
  function stop_job(job) {
    job.stop();
  }
  */

  function check_pending_jobs() {
  	/*
    for (var i=0; i<m_pipeline.jobCount(); i++) {
      var job=m_pipeline.job(i);
      if (job.status().state=='pending') {
        if (m_pipeline.readyToRun(job)) {
          job.start();
        }
      }
    }
    */
  }

  /*
  function housekeeping() {
    check_pending_jobs();
    setTimeout(housekeeping,500);
  }
  housekeeping();
  */

  function format_processor_name(name) {
    return '<span class=processor_name>'+name.split('.').join('.<br />')+'</span>';
  }
  function format_pipeline_name(name) {
    return 'Pipeline: <span class=processor_name>'+name.split('.').join('.<br />')+'</span>';
  }

  function download_console_prv(console_prv) {
    if (!console_prv) {
      alert('Unexpected: console_prv is null.');
      return;
    }
    if ((console_prv.original_checksum)&&(console_prv.original_size===0)) {
      alert('Console output is empty.');
      return;
    }
    var KS=m_job_manager.kuleleClient();
    KS.downloadRawFromPrv(console_prv);
  }

  refresh();
}