#ifndef MLPINTERFACE_H
#define MLPINTERFACE_H

#include <QString>
#include <QObject>
#include <QWebFrame>

class MLPInterface : public QObject {
    Q_OBJECT
public:
    MLPInterface(QWebFrame *frame);
    virtual ~MLPInterface();

    Q_INVOKABLE void open_mountainview(QString mv2_json);
    Q_INVOKABLE void download(QString text);
public slots:
    void larinetserver(QString req_json,QString callback_str);


private:
    QWebFrame *frame=0;
};

#endif // MLPINTERFACE_H

