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
  JSQObject=require(__dirname+'/../jsq/src/jsqcore/jsqobject.js').JSQObject;

  exports.PrvListManager=PrvListManager;
}

function PrvListManager(O) {
  O=O||this;
  JSQObject(O);

  var category='PrvListManager';
  
  this.setPrvRecord=function(name,prv_record) {m_prv_records[name]=JSQ.clone(prv_record); m_prv_records[name].name=name; O.emit('changed');};
  this.setPrv=function(name,prv) {m_prv_records[name]={name:name,prv:prv}; O.emit('changed');};
  this.removePrvRecord=function(name) {delete m_prv_records[name]; O.emit('changed');};
  this.prvRecord=function(name) {return m_prv_records[name]||null;};
  this.prv=function(name) {return (O.prvRecord(name)||{}).prv||null;};
  this.prvRecordNames=function() {return prvRecordNames();};
  this.checkOnServer=function(prv_name) {checkOnServer(prv_name);};
  //this.checkOnS3=function(prv_name,bucket) {checkOnS3(prv_name,bucket);};
  this.checkOnRB=function(prv_name) {checkOnRB(prv_name);};
  this.clearPrvRecords=function() {m_prv_records=[]; O.emit('changed');};
  this.renamePrvRecord=function(name,new_name) {return renamePrvRecord(name,new_name);};
  this.fromObject=function(storage_object) {fromObject(storage_object);};
  this.toObject=function() {return toObject();};
  this.kuleleClient=function() {return m_kulele_client;};
  this.setKuleleClient=function(KC) {m_kulele_client=KC; JSQ.connect(m_kulele_client,'changed',O,function() {O.checkOnServer();});};
  
  var m_prv_records={};
  
  function prvRecordNames() {
    var ret=[];
    for (var name in m_prv_records) {
      ret.push(name);
    }
    ret.sort();
    return ret;
  }
  
  function checkOnServer(prv_name) {
    if (!prv_name) {
      for (var name in m_prv_records) {
        m_prv_records[name].on_server=undefined;
      }
      O.emit('changed');
      var delay=0; //for effect
      for (var name in m_prv_records) {
        if (name) {
          schedule_check(name,delay);
          delay+=0;
        }
      }
    }
    else {
      var prvrec=m_prv_records[prv_name];
      check_on_server(prv_name,prvrec);
    }
    function schedule_check(name,delay) {
      setTimeout(function() {checkOnServer(name);},delay);
    }
  }
  function check_on_server(name,prvrec) {
    if (!prvrec) {
      set_val(undefined);
      return;
    }
    if (prvrec.content) {
      set_val('content');
      return;
    }
    if (!m_kulele_client) {
      console.log ('Kulele client not set.');
      set_val(undefined);
      return;
    }
    if (!prvrec.prv) {
      set_val(undefined);
      return;
    }
    m_kulele_client.prvLocate(prvrec.prv,function(tmp) {
      if ((!tmp.success)||(!tmp.found)) {
        //checkOnS3(name,'mountainlab');
        checkOnRB(name);
      }
      if (!tmp.success) {
        set_val(undefined);
        return;
      }
      set_val(tmp.found);
    });
    function set_val(val) {
      if (!prvrec) return;
      if (prvrec.on_server!==val) {
        prvrec.on_server=val;
        O.emit('changed');
      }
    }
  }
  /*
  function checkOnS3(name,bucket) {
    var prvrec=m_prv_records[name]||null;
    if (!prvrec) return;
    if (prvrec.content) return;
    var url='https://mlcps.herokuapp.com/api/prv_locate';
    var req={
      bucket:bucket,
      sha1:prvrec.prv.original_checksum,
      size:prvrec.prv.original_size
    };
    jsu_http_post_json(url,req,{},function(tmp) {
      if (tmp.success) tmp=tmp.object;
      if (!tmp.success) {
        console.log ('Error checking on S3: '+tmp.error);
        set_val(undefined,'');
        return;
      }
      if (tmp.found) {
        set_val(true,tmp.path);
      }
      else {
        set_val(false,'');
      }
    });
    function set_val(val,s3_address) {
      if (!prvrec) return;
      if ((prvrec.on_s3!==val)||(prvrec.s3_address!=s3_address)) {
        prvrec.on_s3=val;
        prvrec.s3_address=s3_address;
        O.emit('changed');
      }
    }
  }
  */
  function checkOnRB(name) {
    var prvrec=m_prv_records[name]||null;
    if (!prvrec) return;
    if (prvrec.content) return;
    var url='http://river.simonsfoundation.org/stat/'+prvrec.prv.original_checksum;
    jsu_http_get_json(url,{},function(tmp) {
      if (!tmp.success) {
        console.log ('Error checking on RB: '+tmp.error);
        set_val(undefined,'');
        return;
      }
      tmp=tmp.object;
      if (!tmp.success) {
        set_val(false,'');
        return;
      }
      if (tmp.size!=prvrec.prv.original_size) {
        console.log ('Incorrect size for file found on RB: '+tmp.size+' <> '+prvrec.prv.original_size);
        set_val(false,'');
        return;
      }
      set_val(true,'http://river.simonsfoundation.org/download/'+prvrec.prv.original_checksum);
    });
    function set_val(val,rb_address) {
      if (!prvrec) return;
      if ((prvrec.on_rb!==val)||(prvrec.rb_address!=rb_address)) {
        prvrec.on_rb=val;
        prvrec.rb_address=rb_address;
        O.emit('changed');
      }
    }
  }
  function renamePrvRecord(name,new_name) {
    if (!(name in m_prv_records)) return false;
    if (new_name in m_prv_records) return false;
    m_prv_records[new_name]=m_prv_records[name];
    m_prv_records[new_name].name=new_name;
    delete m_prv_records[name];
    O.emit('prv_renamed',{name:name,new_name:new_name});
    O.emit('changed');
    O.emit('save');
    return true;
  }
  function fromObject(obj) {
    m_prv_records={};
    var prv_records=obj.prv_records||{};
    if (prv_records) {
      for (var name in prv_records) {
        prv_records[name].on_server=undefined;
        O.setPrvRecord(name,prv_records[name]);
      }
    }
    O.checkOnServer();
    O.emit('changed');
  }
  function toObject() {
    var obj={};
    obj.prv_records=m_prv_records;
    return obj;
  }

  function ends_with(str,str2) {
    return (str.slice(str.length-str2.length)==str2);
  }
  function starts_with(str,str2) {
    return (str.slice(0,str2.length)==str2);
  }
}
