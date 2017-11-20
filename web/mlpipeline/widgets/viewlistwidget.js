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
function ViewListWidget(O,prv_list_manager,m_view_list_manager) {
  O=O||this;
  JSQWidget(O);
  O.div().addClass('ViewListWidget');
  O.div().addClass('ListWidget');

  this.refresh=function() {refresh();};
  this.toObject=function() {return toObject();};
  this.fromObject=function(obj) {fromObject(obj);};

  var m_table=new MLTableWidget();
  m_table.setRowsMoveable(true);
  
  O.div().append(m_table.div());
  O.div().css({overflow:"auto"});
      
  JSQ.connect(m_view_list_manager,'changed',O,refresh);
  JSQ.connect(m_table,'rows_moved',O,on_rows_moved);

  JSQ.connect(O,'sizeChanged',O,update_layout);
  function update_layout() {
    var W=O.width();
    var H=O.height();
    m_table.setSize(W,H);

    /*
    var num_cols=3;
    var margin1=10,spacing1=10;
    var colwidth=(W-margin1)/num_cols-spacing1;
    var font_size=determine_font_size_from_colwidth(colwidth);
    var font_size_small=Math.max(10,font_size-4);
    var font_size_large=font_size+4;
    O.div().find('th,td').css({"max-width":colwidth,"font-size":font_size+"px"});
    */
    //O.div().find('.small').css({"max-width":colwidth,"font-size":font_size_small+"px"});
    //O.div().find('.large').css({"max-width":colwidth,"font-size":font_size_large+"px"});
    //O.div().find('.data_cell').css({"min-width":W-200})
    //O.div().find('.data_cell').css({"max-width":W-200})
  }

  /*
  function determine_font_size_from_colwidth(colwidth) {
    return Math.max(11,Math.min(16,colwidth/10));
  }
  */

  function toObject() {
    return m_view_list_manager.toObject();
  }
  function fromObject(obj) {
    m_view_list_manager.fromObject(obj);
  }
 
  function refresh() {
    var VM=m_view_list_manager;

    m_table.clearRows();
    m_table.setColumnCount(5);
    m_table.headerRow().cell(0).html('');
    m_table.headerRow().cell(1).html('');
    m_table.headerRow().cell(2).html('');
    m_table.headerRow().cell(3).html('View name');
    m_table.headerRow().cell(4).html('Data');
    m_table.setColumnProperties(0,{"max-width":20}); //buttons1
    m_table.setColumnProperties(1,{"max-width":20}); //buttons2
    m_table.setColumnProperties(2,{"max-width":20}); //buttons3

    for (var i=0; i<VM.viewCount(); i++) {
      var row0=m_table.createRow();
      row0.view_index=i;
      row0.setIsMoveable(true);
      m_table.addRow(row0);
    }
    var row0=m_table.createRow();
    m_table.addRow(row0);
    var create_link=$('<a title="Create new view" href=#>Create view</a>');
    create_link.click(create_new_view);
    row0.cell(3).append(create_link);
    update_layout();
    update_contents();
  }

  function update_contents() {
    for (var i=0; i<m_table.rowCount(); i++) {
      var row=m_table.row(i);
      if (row.view_index>=0) {
        var view=m_view_list_manager.view(row.view_index);
        update_view_table_row(i,view);
      }
    }
  }

  function on_rows_moved() {
    var new_view_order=[];
    for (var i=0; i<m_table.rowCount(); i++) {
      var row=m_table.row(i);
      if (row.view_index>=0) {
        new_view_order.push(row.view_index);
        row.view_index=i; //after reordering this will be the correct view_index
      }
    }
    m_view_list_manager.reorderViews(new_view_order);
  }

  function update_view_table_row(i,view) {
    var row=m_table.row(i);

    var remove_button=$('<a class=remove_button title="Remove this view" />');
    remove_button.click(function() {ask_remove_view(i);});
    row.cell(0).empty();
    row.cell(0).append(remove_button);

    var duplicate_button=$('<a class=duplicate_button title="Duplicate view" />');
    duplicate_button.click(function() {duplicate_view(i);});
    row.cell(1).empty();
    row.cell(1).append(duplicate_button);

    var open_view_button=$('<a class=search_button title="Open this view" />');
    open_view_button.click(function() {open_view(i);});
    row.cell(2).empty();
    row.cell(2).append(open_view_button);

    var name_cell=$('<span><span class=edit_view_name title="Click to edit name"><span class=edit_button /></span>&nbsp;<span class=large id=name /></span>');
    name_cell.find('#name').html(view.name());
    name_cell.find('.edit_view_name').click(function() {
      edit_view_name(i);
    });
    row.cell(3).empty();
    row.cell(3).append(name_cell);

    var XX=create_data_cell(view.data());

    var data_cell=$('<span><span class=edit_view_data title="Click to edit view data"><span class=edit_button /></span>&nbsp;<span class=small id=data /></span>');
    data_cell.find('#data').append(XX);
    data_cell.find('.edit_view_data').click(function() {
      edit_view_data(i);
    });
    row.cell(4).empty();
    row.cell(4).append(data_cell);
  }

  function find_prv_names(data) {
    var ret=[];
    if (typeof data == 'object') {
      for (var key in data) {
        if (typeof data[key] == 'string') {
          var str=data[key];
          if (str.indexOf('${')===0) {
            var str0=str.slice(2,str.length-1);
            if (ret.indexOf(str0)<0)
              ret.push(str0);
          }
        }
        else {
          var ret2=find_prv_names(data[key]);
          for (var j in ret2) {
            var str0=ret2[j];
            if (ret.indexOf(str0)<0) {
              ret.push(str0);
            }
          }
        }
      }
    }
    return ret;
  }

  function create_data_cell(DD) {
    var prv_elements=[];
    var prv_names=find_prv_names(DD);
    for (var i in prv_names) {
      var elmt=create_prv_element(prv_names[i]);
      prv_elements.push(elmt);
    }
    var ret=$('<span/>');
    for (var i=0; i<prv_elements.length; i++) {
      if (i>0) ret.append(', ');
      ret.append(prv_elements[i]);
    }
    return ret;
  }

  function create_prv_element(prv_name) {
    var PLM=prv_list_manager;
    
    var ret=$('<span></span>');
    JSQ.connect(PLM,'changed',O,update_content);
    update_content();
    function update_content() {
      var prvrec=PLM.prvRecord(prv_name);
      if (!prvrec) {
        ret.html('<span>['+prv_name+']</span>');
      }
      else {
        var txt0=prv_name;
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

  function create_new_view() {
    var V=new ViewListView();
    V.setName(get_default_name());
    m_view_list_manager.addView(V);
  }

  function duplicate_view(i) {
    var V=new ViewListView();
    V.fromObject(m_view_list_manager.view(i).toObject());
    m_view_list_manager.insertView(i,V);
  }
  
  /*
  function create_view_table_row(i,view) {
    var tr=$('<tr />');
    tr.append('<td id=buttons1 />');
    tr.append('<td id=buttons2 />');
    tr.append('<td><nobr><span class=edit_view_name title="Click to edit name"><span class=edit_button />&nbsp;</span><span class=large id=name></span></nobr></td>');
    tr.append('<td><span class=edit_view_data title="Click to edit view data"><span class=edit_button /></span><span class=small id=data></span></td>');


    m_table.append(tr);
    tr.find('#name').html(view.name());
    //tr.find('#data').html(JSON.stringify(view.data()));

    tr.find('#buttons1').empty();
    var remove_button=$('<a class=remove_button title="Remove this view" />');
    tr.find('#buttons1').append(remove_button);
    remove_button.click(function() {ask_remove_view(i);});
    
    tr.find('#buttons2').empty();
    var open_view_button=$('<a class=search_button title="Open this view" />');
    tr.find('#buttons2').append(open_view_button);
    open_view_button.click(function() {open_view(i);});
    
    tr.find('.edit_view_name').click(function() {
      edit_view_name(i);
    });
    tr.find('.edit_view_data').click(function() {
      edit_view_data(i);
    });
  }
  */

  function edit_view_name(i) {
    var V=m_view_list_manager.view(i);
    var new_name=prompt('View name:',V.name());
    if (!new_name) return;
    V.setName(new_name);
    update_view_table_row(i,V);
  }

  function edit_view_data(i) {
    var V=m_view_list_manager.view(i);
    var dlg=new EditBanjoDialog();
    dlg.setObject(V.data());
    dlg.show();
    JSQ.connect(dlg,'accepted',O,function() {
      V.setData(dlg.object());
      update_view_table_row(i,V);
    });
    /*
    var V=m_view_list_manager.view(i);
    var new_data=prompt('View data:',JSON.stringify(V.data()));
    if (!new_data) return;
    V.setData(JSON.parse(new_data));;
    refresh(); //todo: only update, don't refresh
    */
  }
    
  function ask_remove_view(i) {
    var VV=m_view_list_manager.view(i);
    if (confirm('Remove view ('+VV.name()+')?')) {
      m_view_list_manager.removeView(i);
    }
  }
  
  function get_default_name() {
    var VM=m_view_list_manager;
    var names=VM.viewNames();
    var num=1;
    while (names.indexOf('view'+num)>=0) num++;
    return 'view'+num;
  }

  function resolve_data_urls(data,callback) {
    if (typeof data == 'object') {
      var keys=[];
      for (var key in data) keys.push(key);
      foreach(keys,function(i,key,cb) {
        if (typeof data[key] == 'string') {
          var str=data[key];
          if (str.indexOf('${')===0) {
            var str0=str.slice(2,str.length-1);
            var prv0=prv_list_manager.prv(str0);
            if (!prv0) {
              alert('No such prv: '+str0);
              return;
            }
            var KC=prv_list_manager.kuleleClient();
            KC.prvLocate(prv0,function(tmp) {
              if (!tmp.found) {
                alert('Unable to find prv on server: '+str0);
                return;
              }
              data[key]=tmp.url;
              cb();
            });
          }
          else cb();
        }
        else {
          resolve_data_urls(data[key],cb);
        }
      },function() {
        callback();
      });
    }
    else {
      callback();
    }
  }

  function foreach(list,step,callback) {
    var i=0;
    next_step();
    function next_step() {
      if (i>=list.length) {
        callback();
        return;
      }
      step(i,list[i],function() {
        i++;
        next_step();
      });
    }
  }

  function open_view(i) {
    var V=m_view_list_manager.view(i);
    var data=V.data();
    resolve_data_urls(data,function() {
      if (data.view_type=='banjoview') {
        url4text(JSON.stringify(data),function(tmp) {
          if (!tmp.success) {
            alert('Error getting url4text: '+tmp.error);
            return;
          }
          var url0=tmp.url;
          var url='../banjoview?config_url='+btoa(url0);
          window.open(url,'_blank');
        });
      }
      else {
        alert('Unrecognized view type: '+data.view_type);
      }
    });
  }
    
  refresh();
}

function ViewListManager(O) {
  O=O||this;
  JSQObject(O);

  this.viewCount=function() {return m_views.length;};
  this.view=function(i) {return m_views[i];};
  this.viewNames=function() {return viewNames();};
  this.addView=function(V) {addView(V);};
  this.insertView=function(i,V) {insertView(i,V);};
  this.removeView=function(i) {return removeView(i);};
  this.clearViews=function() {m_views=[]; O.emit('changed');};
  this.toObject=function() {return toObject();};
  this.fromObject=function(obj) {fromObject(obj);};
  this.reorderViews=function(new_view_order) {reorderViews(new_view_order);};

  var m_views=[];

  function toObject() {
    var list=[];
    for (var i=0; i<O.viewCount(); i++) {
      list.push(O.view(i).toObject());
    }
    return {view_list:list};
  }

  function fromObject(obj) {
    O.clearViews();
    var list=obj.view_list||[];
    for (var i=0; i<list.length; i++) {
      var V=new ViewListView();
      V.fromObject(list[i]);
      O.addView(V);
    }
  }

  function viewNames() {
    var ret=[];
    for (var i in m_views) {
      ret.push(m_views[i].name());
    }
    return ret;
  }
  function removeView(i) {
    m_views.splice(i,1);
    O.emit('changed');
  }
  function addView(V) {
    insertView(m_views.length,V);
  }
  function insertView(i,V) {
    m_views.splice(i,0,V);
    O.emit('changed');
  }

  function reorderViews(new_view_order) {
    if (new_view_order.length!=m_views.length) {
      console.error('Incorrect length of new_view_order in reorderViews');
      return;
    }
    var m_new_views=[];
    for (var i=0; i<new_view_order.length; i++) {
      m_new_views.push(m_views[new_view_order[i]]);
    }
    m_views=m_new_views;
  }

}

function ViewListView() {
  this.setName=function(name) {m_name=name;};
  this.setData=function(data) {m_data=JSQ.clone(data);};
  this.name=function() {return m_name;};
  this.data=function() {return JSQ.clone(m_data);};
  this.toObject=function() {return toObject();};
  this.fromObject=function(obj) {fromObject(obj);};

  var m_name='';
  var m_data={};

  function toObject() {
    return {
      name:m_name,
      data:JSQ.clone(m_data)
    };
  }
  function fromObject(obj) {
    m_name=obj.name||'';
    m_data=JSQ.clone(obj.data||{});
  }
}
