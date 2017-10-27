TEMPLATE = subdirs

# usage:
# qmake
# qmake "COMPONENTS = mlpipeline"

isEmpty(COMPONENTS) {
    COMPONENTS = mlpipeline
}

CONFIG += ordered

defineReplace(ifcomponent) {
  contains(COMPONENTS, $$1) {
    message(Enabling $$1)
    return($$2)
  }
  return("")
}

SUBDIRS += $$ifcomponent(mlpipeline,cpp/mlpipeline/src/mlpipeline.pro)

DISTFILES += cpp/features/*
# DISTFILES += cpp/debian/*

deb.target = deb
deb.commands = debuild $(DEBUILD_OPTS) -us -uc

QMAKE_EXTRA_TARGETS += deb
