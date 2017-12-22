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

	var m_docstor_client=null;
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
		var ds=m_manager.study().dataset(ds_id);
		if (!ds) {
			m_dataset_widget.refresh();
			return;	
		}
		m_dataset_widget.setDataset(ds_id,ds);
		m_dataset_widget.refresh();
	}

	function setMLSManager(M) {
		m_manager=M;
		m_list_widget.setMLSManager(M);
		m_dataset_widget.setMLSManager(M);
	}

	update_layout();
}
