---
layout: post
title: "Matplotlib Tutorial"
discription: "Nicolas P. Rougier - Euroscipy 2012"
category: python
tags: [matplotlib, python]
disqus: true
---
{% include JB/setup %}

# Matplotlib tutorial

* toc
{: toc}

这个教程基于可以从[scipy lecture note](http://scipy-lectures.github.com/)得到的 Mike Müller的[教程](http://scipy-lectures.github.com/intro/matplotlib/matplotlib.html)。

源代码可从[这里](http://www.loria.fr/~rougier/teaching/matplotlib/matplotlib.rst)获得。图像在[figures](http://www.loria.fr/~rougier/teaching/matplotlib/figures/)文件夹内，所有的脚本位于[scripts](http://www.loria.fr/~rougier/teaching/matplotlib/scripts/)文件夹。

所有的代码和材料以[Creative Commons Attribution 3.0 United States License (CC-by)](http://creativecommons.org/licenses/by/3.0/us)发布。

特别感谢Bill Wing和Christoph Deil的检查和校正。

## 引言

matplotlib大概是被使用最多的二维绘图Python包。它不仅提供一个非常快捷的用python可视化数据的方法，而且提供了出版质量的多种格式图像。我们将要探索matplotlib包含最常见情况的交互模式。

### Ipython 和 pylab模式

[IPython](http://ipython.org/)是一个增强的Python交互shell，它拥有很多有趣的特性包括被命名的输入与输出，可使用shell命令，增强的调试和许多其它特性。当我们在命令参数中用`-pylab`(自从IPython0.12版变成`--pylab`),它容许交互的matplotlib会话有像Matlab/Mathematica样的功能。

### pylab

pylab提供了一个针对matplotlib面向对象绘图库的程序界面。它模仿Matlab(TM)开发。因此，pylab大部分的绘图命令和参数和Matlab(TM)相似。重要的命令被交互示例解释。

## 简单绘图

在这一部分，我们想在同一个图片中绘制正弦和余弦函数。从默认设置开始，我们将一步一步地改进使它看上去更棒。

首先获得正弦和余弦函数的数据：

    from pylab import *
    
    X = np.linspace(-np.pi, np.pi, 256,endpoint=True)
    C,S = np.cos(X), np.sin(X)

X现在是一个numpy数组，包含从-π到+π(包含π)等差分布的256个值。C是正弦(256个值)，S是余弦(256个值)。

运行这个例子，你可以在IPython交互会话键入它们

    [lyy@arch ~]$ ipython2 --pylab
    Python 2.7.3 (default, Apr 24 2012, 00:00:54) 
    Type "copyright", "credits" or "license" for more information.
    
    IPython 0.13 -- An enhanced Interactive Python.
    ?         -> Introduction and overview of IPython's features.
    %quickref -> Quick reference.
    help      -> Python's own help system.
    object?   -> Details about 'object', use 'object??' for extra details.
    
    Welcome to pylab, a matplotlib-based Python environment [backend: Qt4Agg].
    For more information, type 'help(pylab)'.

或者你可以下载每个示例然后使用普通的的python运行它：

    $ python exercice_1.py

你可以点击相应图片的获得每一步的源码。

### 使用默认

### 示例默认
