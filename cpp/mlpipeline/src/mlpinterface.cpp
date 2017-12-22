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
#include "mlpinterface.h"
#include <QDebug>
#include <QDir>
#include <QFileDialog>
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonObject>
#include <QMessageBox>
#include <QProcess>
#include <QCoreApplication>

bool write_text_file(const QString& path, const QString& txt)
{
    QFile f(path);
    if (!f.open(QFile::WriteOnly | QFile::Text))
        return false;
    QTextStream out(&f);
    out << txt;
    return true;
}
#if QT_VERSION >= 0x050600
MLPInterface::MLPInterface(QWebEnginePage *frame_in)
#else
MLPInterface::MLPInterface(QWebFrame *frame_in)
#endif
{
    frame=frame_in;
}

MLPInterface::~MLPInterface()
{

}

void MLPInterface::open_mountainview(QString mv2_json)
{
    //QJsonObject mv2=QJsonDocument::fromJson(mv2_json.toUtf8()).object();
    QString tmp_path=QDir::tempPath()+"/tmp.mv2";
    write_text_file(tmp_path,mv2_json);
    QString cmd=QString("mountainview %1").arg(tmp_path);
    qDebug().noquote() << "Running: "+cmd;
    QProcess::startDetached(cmd);
}

void MLPInterface::download(QString text, QString file_name)
{
    QString fname=file_name;
    if (fname.isEmpty()) {
        fname=QFileDialog::getSaveFileName(0,"Save file to your computer");
        if (fname.isEmpty()) return;
    }
    if (!write_text_file(fname,text)) {
        QMessageBox::critical(0,"Unable to save file","Unable to save file: "+fname);
    }
    QMessageBox::information(0,"File saved","File saved.");
}

void MLPInterface::quit()
{
    qApp->quit();
}

void MLPInterface::larinetserver(QString req_json,QString callback_str)
{
    qDebug().noquote() << "===========================" << req_json.count();
    qDebug().noquote() << req_json;

    QJsonObject req=QJsonDocument::fromJson(req_json.toUtf8()).object();
    QString action=req["a"].toString();
    if (action=="processor_spec") {
    }

    QJsonObject response;
    response["success"]=true;
    QString str=QString("%1('%2');").arg(callback_str).arg((QString)QJsonDocument(response).toJson(QJsonDocument::Compact));
    qDebug().noquote() << str;
#if QT_VERSION >= 0x050600
    frame->runJavaScript(str);
#else
    frame->evaluateJavaScript(str);
#endif
}

