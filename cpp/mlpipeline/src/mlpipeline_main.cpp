#include <QApplication>
#include <QFile>
#include <QWebInspector>
#include <QWebView>
#include <QWebFrame>
#include <QHBoxLayout>
#include <QSplitter>
#include <QTabWidget>
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

int main(int argc, char *argv[]) {
    QApplication a(argc,argv);

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

    QWebInspector *WI=new QWebInspector;
    WI->setPage(W->page());

    QWidget main_window;
    QHBoxLayout *main_layout=new QHBoxLayout;
    main_window.setLayout(main_layout);
    QTabWidget *tab_widget=new QTabWidget;
    tab_widget->setTabPosition(QTabWidget::South);
    main_layout->addWidget(tab_widget);
    tab_widget->addTab(W,"MLPipeline");
    tab_widget->addTab(WI,"Debug");

    W->load(url);
    W->setFocusPolicy(Qt::StrongFocus);

    main_window.showMaximized();

    return a.exec();
}
