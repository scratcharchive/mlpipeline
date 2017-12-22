QT += core gui widgets

greaterThan(QT_MINOR_VERSION, 5) {
    QT += webenginewidgets webchannel
} else {
    QT += webkitwidgets
}

CONFIG += c++11

DESTDIR = ../bin
OBJECTS_DIR = ../build
MOC_DIR=../build
TARGET = mlpipeline
TEMPLATE = app

SOURCES += mlpipeline_main.cpp \
    mlpinterface.cpp \
    clparams.cpp

HEADERS += \
    mlpinterface.h \
    clparams.h
DEFINES += "MLP_DIR=\\\"$${MLP_DIR}\\\""

include(../../installbin.pri)
