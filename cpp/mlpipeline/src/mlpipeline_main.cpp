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
#include <QApplication>
#include <QFile>
#include <QWebInspector>
#include <QWebView>
#include <QWebFrame>
#include <QHBoxLayout>
#include <QSplitter>
#include <QTabWidget>
#include <QCloseEvent>
#include <QMainWindow>
#include <QFileInfo>
#include <QJsonDocument>
#include "clparams.h"
#include "mlpinterface.h"

QString read_text_file(const QString& fname, QTextCodec* codec=0)
{
    QFile file(fname);
    if (!file.open(QIODevice::ReadOnly | QIODevice::Text)) {
        return QString();
    }
    QTextStream ts(&file);
    if (codec != 0)
        ts.setCodec(codec);
    QString ret = ts.readAll();
    file.close();
    return ret;
}

class MyPage : public QWebPage {
  public:
    void javaScriptConsoleMessage(const QString & message, int lineNumber, const QString & sourceID) Q_DECL_OVERRIDE {
        qDebug().noquote() << QString("%1:%2: %3").arg(sourceID).arg(lineNumber).arg(message);
    }
};

class MyMainWidget : public QMainWindow {
public:
    void closeEvent(QCloseEvent *evt) Q_DECL_OVERRIDE {
        if (frame) {
            bool val=frame->evaluateJavaScript("okay_to_close()").toBool();
            if (!val) {
                evt->ignore();
                return;
            }
        }
        QMainWindow::closeEvent(evt);
    }
    QWebFrame *frame=0;
};

int main(int argc, char *argv[]) {
    QApplication a(argc,argv);

    CLParams CLP(argc,argv);

    QString arg1=CLP.unnamed_parameters.value(0);

    QString mlp_path;
    if (arg1.endsWith(".mlp")) {
        mlp_path=arg1;
    }

    QWebView *W=new QWebView;
    W->setPage(new MyPage());
    //TODO: Witold: this is how I find the .js source. we'll need to think of a better way
    QString path=QString(MLP_DIR)+"/web/mlpipeline";
    if (!QFile::exists(path+"/index.html")) {
        //find it somewhere else...
    }
    //QString html=read_text_file(path+"/index.html");
    QString url="file:///"+path+"/index.html";

    W->page()->settings()->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);
    W->page()->settings()->setAttribute(QWebSettings::AcceleratedCompositingEnabled, true);
    W->page()->settings()->setAttribute(QWebSettings::LocalContentCanAccessRemoteUrls, true);
    W->page()->settings()->setAttribute(QWebSettings::LocalContentCanAccessFileUrls, true);
    W->page()->settings()->setAttribute(QWebSettings::JavascriptEnabled, true);
    W->page()->settings()->setAttribute(QWebSettings::LocalStorageEnabled, true);
    W->page()->settings()->setLocalStoragePath(QString(MLP_DIR)+"/local_storage"); //Witold: this needs to be fixed
    QWebFrame *frame=W->page()->mainFrame();
    frame->addToJavaScriptWindowObject("mlpinterface",new MLPInterface(frame));
    frame->evaluateJavaScript("window.mlpipeline_mode='local';");

    if (!mlp_path.isEmpty()) {
        QString str=read_text_file(mlp_path);
        frame->evaluateJavaScript(QString("window.mlp_file_content=atob('%1');").arg((QString)str.toUtf8().toBase64()));
        frame->evaluateJavaScript(QString("window.mlp_file_name='%1';").arg(QFileInfo(mlp_path).fileName()));
    }
    else {
        frame->evaluateJavaScript(QString("window.mlp_load_default_browser_storage=true;"));
    }

    QWebInspector *WI=new QWebInspector;
    WI->setPage(W->page());

    MyMainWidget main_window;
    main_window.frame=frame;
    //QHBoxLayout *main_layout=new QHBoxLayout;
    //main_window.setLayout(main_layout);
    QTabWidget *tab_widget=new QTabWidget;
    tab_widget->setTabPosition(QTabWidget::South);
    //main_layout->addWidget(tab_widget);
    main_window.setCentralWidget(tab_widget);
    tab_widget->addTab(W,"MLPipeline");
    tab_widget->addTab(WI,"Debug");

    W->load(url);
    W->setFocusPolicy(Qt::StrongFocus);

    main_window.showMaximized();

    return a.exec();
}
