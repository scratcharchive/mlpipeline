QT += core gui widgets webkitwidgets

CONFIG += c++11

DESTDIR = ../bin
OBJECTS_DIR = ../build
MOC_DIR=../build
TARGET = mlpipeline
TEMPLATE = app

SOURCES += mlpipeline_main.cpp \
    mlpinterface.cpp

HEADERS += \
    mlpinterface.h

DEFINES += "MLP_DIR=\\\"$${MLP_DIR}\\\""

include(../../installbin.pri)
