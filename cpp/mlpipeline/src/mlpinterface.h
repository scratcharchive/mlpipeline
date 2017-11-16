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

