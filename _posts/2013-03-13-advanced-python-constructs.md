---
layout: post
title: "Advanced Python Constructs(译)"
excerpt: "翻译自scipy lecture notes"
category: python
tags: [python， scipy-lecture-notes]
disqus: true
---
{% include JB/setup %}

# 高级Python结构

原谅渣翻译，可能仅仅是给我自己看的……

翻译自[http://scipy-lectures.github.com/advanced/advanced\_python/index.html](http://scipy-lectures.github.com/advanced/advanced_python/index.html)

作者:	Zbigniew Jędrzejewski-Szmek

这章有关Python中被认为高级的特性——就是说并不是每个语言都有的，也是说它们可能在更复杂的程序或库中更有用，但不是说特别特殊或特别复杂。

强调这点很重要：这一章仅仅关于语言自身——关于辅之以Python的标准库功能的特殊语法所支持的特性，不包括那些智能的外部模块实现。

在开发Python程序语言的过程中，它的语法，独一无二。因为它非常透明。建议的更改通过不同的角度评估并在公开邮件列表讨论，最终决定考虑到假设用例的重要性、添加更多特性的负担，其余语法的一致性、是否建议的变种易于读写和理解之间的平衡。这个过程由Python Enhancement Proposals([PEPs](http://www.python.org/dev/peps/))的形式规范。最终这一章节中描述的特性在证明它们确实解决实际问题并且使用起来尽可能简单后被添加。

---
**目录**

* toc
{: toc}

---

## 迭代器(Iterators), 生成表达式(generator expressions)和生成器(generators)

### 迭代器

> **Simplicity**
> 
> Duplication of effort is wasteful, and replacing the various home-grown approaches with a standard feature usually ends up making things more readable, and interoperable as well.
> 
>     Guido van Rossum — [Adding Optional Static Typing to Python](http://www.artima.com/weblogs/viewpost.jsp?thread=86641)



迭代器是依附于[迭代协议](http://docs.python.org/dev/library/stdtypes.html#iterator-types)的对象——基本意味它有一个`next`方法(method)，当调用时，返回序列中的下一个项目。当无项目可返回时，引发(raise)`StopIteration`异常。

迭代对象允许一次循环。它保留单次迭代的状态(位置)，或从另一个角度讲，每次循环序列都需要一个迭代对象。这意味我们可以同时迭代同一个序列不只一次。将迭代逻辑和序列分离使我们有更多的迭代方式。

调用一个容器(container)的`__iter__`方法创建迭代对象是掌握迭代器最直接的方式。`iter`函数为我们节约一些按键。

    >>> nums = [1,2,3]      # note that ... varies: these are different objects
    >>> iter(nums)                           
    <listiterator object at ...>
    >>> nums.__iter__()                      
    <listiterator object at ...>
    >>> nums.__reversed__()                  
    <listreverseiterator object at ...>

    >>> it = iter(nums)
    >>> next(it)            # next(obj) simply calls obj.next()
    1
    >>> it.next()
    2
    >>> next(it)
    3
    >>> next(it)
    Traceback (most recent call last):
      File "<stdin>", line 1, in <module>
    StopIteration

当在循环中使用时，`StopIteration`被接受并停止循环。但通过显式引发(invocation)，我们看到一旦迭代器元素被耗尽，存取它将引发异常。

使用`for...in`循环也使用`__iter__`方法。这允许我们透明地开始对一个序列迭代。但是如果我们已经有一个迭代器，我们想在for循环中能同样地使用它们。为了实现这点，迭代器除了`next`还有一个方法`__iter__`来返回迭代器自身(self)。

Python中对迭代器的支持无处不在：标准库中的所有序列和无序容器都支持。这个概念也被拓展到其它东西：例如`file`对象支持行的迭代。

    >>> f = open('/etc/fstab')
    >>> f is f.__iter__()
    True

`file`自身就是迭代器，它的`__iter__`方法并不创建一个单独的对象：仅仅单线程的顺序读取被允许。

### 生成表达式

第二种创建迭代对象的方式是通过 _生成表达式(generator expression)_ ，列表推导(list comprehension)的基础。为了增加清晰度，生成表达式总是封装在括号或表达式中。如果使用圆括号，则创建了一个生成迭代器(generator iterator)。如果是方括号，这一过程被‘短路’我们获得一个列表`list`。

    >>> (i for i in nums)                    
    <generator object <genexpr> at 0x...>
    >>> [i for i in nums]
    [1, 2, 3]
    >>> list(i for i in nums)
    [1, 2, 3]

在Python 2.7和 3.x中列表表达式语法被扩展到 _字典和集合表达式_。一个集合`set`当生成表达式是被大括号封装时被创建。一个字典`dict`在表达式包含`key:value`形式的键值对时被创建：

    >>> {i for i in range(3)}   
    set([0, 1, 2])
    >>> {i:i**2 for i in range(3)}   
    {0: 0, 1: 1, 2: 4}

如果您不幸身陷古老的Python版本中，这个语法有点糟：

    >>> set(i for i in 'abc')
    set(['a', 'c', 'b'])
    >>> dict((i, ord(i)) for i in 'abc')
    {'a': 97, 'c': 99, 'b': 98}

生成表达式相当简单，不用多说。只有一个陷阱值得提及：在版本小于3的Python中索引变量(`i`)会泄漏。

### 生成器

> **Generators**
> 
> A generator is a function that produces a sequence of results instead of a single value.
> 
>     David Beazley — [A Curious Course on Coroutines and Concurrency](http://www.dabeaz.com/coroutines/)

第三种创建迭代对象的方式是调用生成器函数。一个 _生成器(generator)_ 是包含关键字`yield`的函数。值得注意，仅仅是这个关键字的出现完全改变了函数的本质：`yield`语句不必引发(invoke)，甚至不必可接触。但让函数变成了生成器。当一个函数被调用时，其中的指令被执行。而当一个生成器被调用时，执行在其中第一条指令之前停止。生成器的调用创建依附于迭代协议的生成器对象。就像常规函数一样，允许并发和递归调用。

当`next`被调用时，函数执行到第一个`yield`。每次遇到`yield`语句获得一个作为`next`返回的值，在`yield`语句执行后，函数的执行又被停止。

    >>> def f():
    ...   yield 1
    ...   yield 2
    >>> f()                                   
    <generator object f at 0x...>
    >>> gen = f()
    >>> gen.next()
    1
    >>> gen.next()
    2
    >>> gen.next()
    Traceback (most recent call last):
     File "<stdin>", line 1, in <module>
    StopIteration

让我们遍历单个生成器函数调用的整个历程。

    >>> def f():
    ...   print("-- start --")
    ...   yield 3
    ...   print("-- middle --")
    ...   yield 4
    ...   print("-- finished --")
    >>> gen = f()
    >>> next(gen)
    -- start --
    3
    >>> next(gen)
    -- middle --
    4
    >>> next(gen)                            
    -- finished --
    Traceback (most recent call last):
     ...
    StopIteration

相比常规函数中执行`f()`立即让`print`执行，`gen`不执行任何函数体中语句就被赋值。只有当`gen.next()`被`next`调用，直到第一个`yield`部分的语句才被执行。第二个语句打印`-- middle --`并在遇到第二个yield时停止执行。第三个`next`打印`-- finished --`并且到函数末尾，因为没有`yield`，引发了异常。

当函数yield之后控制返回给调用者后发生了什么？每个生成器的状态被存储在生成器对象中。从这点看生成器函数，好像它是运行在单独的线程，但这仅仅是假象：执行是严格单线程的，但解释器保留和存储在下一个值请求之间的状态。[^1]

为何生成器有用？正如关于迭代器这部分强调的，生成器函数只是创建迭代对象的又一种方式。一切能被`yield`语句完成的东西也能被`next`方法完成。然而，使用函数让解释器魔力般地创建迭代器有优势。一个函数可以比需要`next`和`__iter__`方法的类定义短很多。更重要的是，相比不得不对迭代对象在连续`next`调用之间传递的实例(instance)属性来说，生成器的作者能更简单的理解局限在局部变量中的语句。

还有问题是为何迭代器有用？当一个迭代器用来驱动循环，循环变得简单。迭代器代码初始化状态，决定是否循环结束，并且找到下一个被提取到不同地方的值。这凸显了循环体——最值得关注的部分。除此之外，可以在其它地方重用迭代器代码。

### 双向通信

每个`yield`语句将一个值传递给调用者。这就是为何[PEP 255](http://www.python.org/dev/peps/pep-0255)引入生成器(在Python2.2中实现)。但是相反方向的通信也很有用。一个明显的方式是一些外部(extern)语句，或者全局变量或共享可变对象。通过将先前无聊的`yield`语句变成表达式，直接通信因[PEP 342](http://www.python.org/dev/peps/pep-0342)成为现实(在2.5中实现)。当生成器在yield语句之后恢复执行时，调用者可以对生成器对象调用一个方法，或者传递一个值 _给_ 生成器，然后通过`yield`语句返回，或者通过一个不同的方法向生成器注入异常。

第一个新方法是`send(value)`，类似于`next()`，但是将`value`传递进作为yield表达式值的生成器中。事实上，`g.next()`和`g.send(None)`是等效的。

第二个新方法是`throw(type, value=None, traceback=None)`，等效于在yield语句处

    raise type, value, traceback

不像`raise`(从执行点立即引发异常)，`throw()`首先恢复生成器，然后仅仅引发异常。选用单次throw就是因为它意味着把异常放到其它位置，并且在其它语言中与异常有关。

当生成器中的异常被引发时发生什么？它可以或者显式引发，当执行某些语句时可以通过`throw()`方法注入到yield语句中。任一情况中，异常都以标准方式传播：它可以被`except`和`finally`捕获，或者造成生成器的中止并传递给调用者。

因完整性缘故，值得提及生成器迭代器也有`close()`方法，该方法被用来让本可以提供更多值的生成器立即中止。它用生成器的`__del__`方法销毁保留生成器状态的对象。

让我们定义一个只打印出通过send和throw方法所传递东西的生成器。

    >>> import itertools
    >>> def g():
    ...     print '--start--'
    ...     for i in itertools.count():
    ...         print '--yielding %i--' % i
    ...         try:
    ...             ans = yield i
    ...         except GeneratorExit:
    ...             print '--closing--'
    ...             raise
    ...         except Exception as e:
    ...             print '--yield raised %r--' % e
    ...         else:
    ...             print '--yield returned %s--' % ans
    
    >>> it = g()
    >>> next(it)
    --start--
    --yielding 0--
    0
    >>> it.send(11)
    --yield returned 11--
    --yielding 1--
    1
    >>> it.throw(IndexError)
    --yield raised IndexError()--
    --yielding 2--
    2
    >>> it.close()
    --closing--

**注意：** `next`还是`__next__`?

在Python 2.x中，接受下一个值的迭代器方法是`next`，它通过全局函数`next`显式调用，意即它应该调用`__next__`。就像全局函数`iter`调用`__iter__`。这种不一致在Python 3.x中被修复，`it.next`变成了`it.__next__`。对于其它生成器方法——`send`和`throw`情况更加复杂，因为它们不被解释器隐式调用。然而，有建议语法扩展让`continue`带一个将被传递给循环迭代器中`send`的参数。如果这个扩展被接受，可能`gen.send`会变成`gen.__send__`。最后一个生成器方法`close`显然被不正确的命名了，因为它已经被隐式调用。

### 链式生成器

**注意：** 这是[PEP 380](http://www.python.org/dev/peps/pep-0380)的预览(还未被实现，但已经被Python3.3接受)[^2]

比如说我们正写一个生成器，我们想要yield一个第二个生成器——一个子生成器(subgenerator)——生成的数。如果仅考虑产生(yield)的值，通过循环可以不费力的完成：

    subgen = some_other_generator()
    for v in subgen:
        yield v

然而，如果子生成器需要调用`send()`、`throw()`和`close()`和调用者适当交互的情况下，事情就复杂了。`yield`语句不得不通过类似于前一章节部分定义的`try...except...finally`结构来保证“调试”生成器函数。这种代码在[PEP 380](http://www.python.org/dev/peps/pep-0380#id13)中提供，现在足够拿出将在Python 3.3中引入的新语法了：

    yield from some_other_generator()

像上面的显式循环调用一样，重复从`some_other_generator`中产生值直到没有值可以产生，但是仍然向子生成器转发`send`、`throw`和`close`。

## 装饰器

### 代替和调整原始对象

### 实现类和函数装饰器

### 复制原始函数的文档字符串和其它属性

### 标准库中的示例

### 函数的废弃

### while-loop移除装饰器

### 插件注册系统

### 更多例子和参考

## 上下文管理器

### 捕获异常

### 使用生成器定义上下文管理器

---

## FootNotes

[^1]:就像CPU工作一样，中断时保存断点，最后又恢复。
[^2]:好吧它已经发布了= =，虽然在大多linux发行版中还是2.x和3.2。
