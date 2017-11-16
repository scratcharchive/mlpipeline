#ifndef MLPINTERFACE_H
#define MLPINTERFACE_H

#include <QString>
#include <QObject>
#if QT_VERSION >= 0x050600
#include <QWebEnginePage>
#else
#include <QWebFrame>
#endif

class MLPInterface : public QObject {
    Q_OBJECT
public:
#if QT_VERSION >= 0x050600
    MLPInterface(QWebEnginePage *frame);
#else
    MLPInterface(QWebFrame *frame);
#endif
    virtual ~MLPInterface();

    Q_INVOKABLE void open_mountainview(QString mv2_json);
    Q_INVOKABLE void download(QString text);
public slots:
    void larinetserver(QString req_json,QString callback_str);


private:
#if QT_VERSION >= 0x050600
    QWebEnginePage *frame=0;
#else
    QWebFrame *frame=0;
#endif
};

#endif // MLPINTERFACE_H

